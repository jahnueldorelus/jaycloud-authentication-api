export type DatabaseService = {
  id: number;
  label: string;
  prod_api_url: string;
  prod_ui_url: string;
  dev_api_url: string;
  dev_ui_url: string;
  logo_filename: string;
  service_description: string;
  is_online: 0 | 1;
};
