import { HttpClient } from '../../adapters/http';
import { Profile } from '../../config/types';

export abstract class BaseService {
  protected httpClient: HttpClient;
  protected profile: Profile;

  constructor(profile: Profile, httpClient: HttpClient) {
    this.profile = profile;
    this.httpClient = httpClient;

    // Set the profile for authentication
    this.httpClient.setProfile(profile);
  }
}
