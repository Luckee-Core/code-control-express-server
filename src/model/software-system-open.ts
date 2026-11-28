/** Row in software_system_opens: someone opened a software system's detail page. */
export type SoftwareSystemOpen = {
  id: string;
  software_system_id: string;
  opened_at: string;
};

/** One software system and when it was last opened (newest first in lists). */
export type RecentSoftwareSystemOpen = {
  software_system_id: string;
  last_opened_at: string;
};
