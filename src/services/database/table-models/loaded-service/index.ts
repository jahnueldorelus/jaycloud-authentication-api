import { DatabaseService } from "@services/database/tables/service/types";
import { ServicePublicData } from "./types";
import { envNames } from "@startup/config";

export class LoadedService {
  public readonly id: number;
  public readonly label: string;
  public readonly prodApiUrl: string;
  public readonly prodUiUrl: string;
  public readonly devApiUrl: string;
  public readonly devUiUrl: string;
  public readonly logoFilename: string;
  public readonly serviceDescription: string;
  public readonly isOnline: boolean;

  constructor(serviceData: DatabaseService) {
    this.id = serviceData.id;
    this.label = serviceData.label;
    this.prodApiUrl = serviceData.prod_api_url;
    this.prodUiUrl = serviceData.prod_ui_url;
    this.devApiUrl = serviceData.dev_api_url;
    this.devUiUrl = serviceData.dev_ui_url;
    this.logoFilename = serviceData.logo_filename;
    this.serviceDescription = serviceData.service_description;
    this.isOnline = Boolean(serviceData.is_online);
  }

  /**
   * Generates an immutable JSON object without the service's private info.
   * @returns The service's public info in JSON format
   */
  public getPublicInfoJson(): ServicePublicData {
    const currentEnvironment = process.env[envNames.nodeEnv];

    const publicData: ServicePublicData = {
      _id: this.id.toString(),
      available: this.isOnline,
      description: this.serviceDescription,
      name: this.label,
      uiUrl:
        currentEnvironment === "production" ? this.prodUiUrl : this.devUiUrl,
    };

    return Object.freeze(publicData);
  }
}
