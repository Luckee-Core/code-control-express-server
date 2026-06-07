-- ============================================================================
-- App type templates: pre-defined entities, platforms, and build phases
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_type_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_type app_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_templates JSONB NOT NULL,
  platform_config JSONB NOT NULL,
  build_phases JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_type)
);

CREATE INDEX IF NOT EXISTS idx_app_type_templates_app_type ON app_type_templates(app_type);

CREATE TRIGGER update_app_type_templates_updated_at
  BEFORE UPDATE ON app_type_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed marketplace template
INSERT INTO app_type_templates (app_type, name, description, entity_templates, platform_config, build_phases)
VALUES (
  'marketplace',
  'Marketplace Template',
  'Two-sided marketplace with seller and buyer platforms',
  '{
    "entities": [
      {
        "name": "Vendor",
        "table_name": "vendors",
        "description": "Sellers on the marketplace",
        "platforms": ["seller_web", "seller_mobile"],
        "fields": [
          {"name": "id", "type": "uuid", "nullable": false},
          {"name": "business_name", "type": "text", "nullable": false},
          {"name": "email", "type": "text", "nullable": false},
          {"name": "phone", "type": "text", "nullable": true},
          {"name": "status", "type": "text", "nullable": false, "default_value": "pending"},
          {"name": "created_at", "type": "timestamptz", "nullable": false}
        ]
      },
      {
        "name": "Product",
        "table_name": "products",
        "description": "Products listed on the marketplace",
        "platforms": ["seller_web", "seller_mobile", "buyer_mobile"],
        "fields": [
          {"name": "id", "type": "uuid", "nullable": false},
          {"name": "vendor_id", "type": "uuid", "nullable": false, "references_table": "vendors"},
          {"name": "name", "type": "text", "nullable": false},
          {"name": "description", "type": "text", "nullable": true},
          {"name": "price", "type": "decimal", "nullable": false},
          {"name": "category_id", "type": "uuid", "nullable": true, "references_table": "categories"},
          {"name": "status", "type": "text", "nullable": false, "default_value": "draft"},
          {"name": "created_at", "type": "timestamptz", "nullable": false}
        ]
      },
      {
        "name": "Buyer",
        "table_name": "buyers",
        "description": "Customers on the marketplace",
        "platforms": ["buyer_mobile"],
        "fields": [
          {"name": "id", "type": "uuid", "nullable": false},
          {"name": "email", "type": "text", "nullable": false},
          {"name": "name", "type": "text", "nullable": false},
          {"name": "phone", "type": "text", "nullable": true},
          {"name": "created_at", "type": "timestamptz", "nullable": false}
        ]
      },
      {
        "name": "Order",
        "table_name": "orders",
        "description": "Purchase orders",
        "platforms": ["seller_web", "seller_mobile", "buyer_mobile"],
        "fields": [
          {"name": "id", "type": "uuid", "nullable": false},
          {"name": "buyer_id", "type": "uuid", "nullable": false, "references_table": "buyers"},
          {"name": "vendor_id", "type": "uuid", "nullable": false, "references_table": "vendors"},
          {"name": "total", "type": "decimal", "nullable": false},
          {"name": "status", "type": "text", "nullable": false, "default_value": "pending"},
          {"name": "created_at", "type": "timestamptz", "nullable": false}
        ]
      },
      {
        "name": "Payment",
        "table_name": "payments",
        "description": "Payment transactions",
        "platforms": ["seller_web", "buyer_mobile"],
        "fields": [
          {"name": "id", "type": "uuid", "nullable": false},
          {"name": "order_id", "type": "uuid", "nullable": false, "references_table": "orders"},
          {"name": "amount", "type": "decimal", "nullable": false},
          {"name": "status", "type": "text", "nullable": false},
          {"name": "payment_method", "type": "text", "nullable": false},
          {"name": "created_at", "type": "timestamptz", "nullable": false}
        ]
      },
      {
        "name": "Review",
        "table_name": "reviews",
        "description": "Product and vendor reviews",
        "platforms": ["seller_web", "buyer_mobile"],
        "fields": [
          {"name": "id", "type": "uuid", "nullable": false},
          {"name": "product_id", "type": "uuid", "nullable": true, "references_table": "products"},
          {"name": "vendor_id", "type": "uuid", "nullable": true, "references_table": "vendors"},
          {"name": "buyer_id", "type": "uuid", "nullable": false, "references_table": "buyers"},
          {"name": "rating", "type": "integer", "nullable": false},
          {"name": "comment", "type": "text", "nullable": true},
          {"name": "created_at", "type": "timestamptz", "nullable": false}
        ]
      },
      {
        "name": "Category",
        "table_name": "categories",
        "description": "Product categories",
        "platforms": ["seller_web", "buyer_mobile"],
        "fields": [
          {"name": "id", "type": "uuid", "nullable": false},
          {"name": "name", "type": "text", "nullable": false},
          {"name": "parent_id", "type": "uuid", "nullable": true, "references_table": "categories"},
          {"name": "created_at", "type": "timestamptz", "nullable": false}
        ]
      },
      {
        "name": "Message",
        "table_name": "messages",
        "description": "Buyer-vendor communication",
        "platforms": ["seller_web", "seller_mobile", "buyer_mobile"],
        "fields": [
          {"name": "id", "type": "uuid", "nullable": false},
          {"name": "buyer_id", "type": "uuid", "nullable": false, "references_table": "buyers"},
          {"name": "vendor_id", "type": "uuid", "nullable": false, "references_table": "vendors"},
          {"name": "sender_type", "type": "text", "nullable": false},
          {"name": "content", "type": "text", "nullable": false},
          {"name": "created_at", "type": "timestamptz", "nullable": false}
        ]
      }
    ]
  }'::jsonb,
  '{
    "platforms": [
      {
        "id": "seller_web",
        "name": "Seller Web",
        "description": "Admin/management interface for vendors",
        "repo_type": "web",
        "order": 1
      },
      {
        "id": "seller_mobile",
        "name": "Seller Mobile",
        "description": "Mobile app for vendor management",
        "repo_type": "mobile",
        "order": 2
      },
      {
        "id": "buyer_mobile",
        "name": "Buyer Mobile",
        "description": "Customer-facing mobile app",
        "repo_type": "mobile",
        "order": 3
      }
    ]
  }'::jsonb,
  '{
    "phases": [
      {
        "id": "data_model",
        "name": "Data Model",
        "description": "Generate models and migrations",
        "order": 1,
        "tasks": ["model", "migration"]
      },
      {
        "id": "crud_operations",
        "name": "CRUD Operations",
        "description": "Generate API routes and endpoints",
        "order": 2,
        "tasks": ["api_routes"],
        "depends_on": ["data_model"]
      },
      {
        "id": "tables",
        "name": "Tables",
        "description": "Generate list/table views",
        "order": 3,
        "tasks": ["table_component"],
        "depends_on": ["crud_operations"]
      },
      {
        "id": "detail_pages",
        "name": "Detail Pages",
        "description": "Generate detail/edit views",
        "order": 4,
        "tasks": ["detail_page"],
        "depends_on": ["tables"]
      }
    ]
  }'::jsonb
)
ON CONFLICT (app_type) DO NOTHING;
