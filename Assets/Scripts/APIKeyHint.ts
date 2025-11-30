import {
  AvaliableApiTypes,
  RemoteServiceGatewayCredentials,
} from "RemoteServiceGateway.lspkg/RemoteServiceGatewayCredentials";

@component
export class APIKeyHint extends BaseScriptComponent {
  @input text: Text;
  onAwake() {
    let apiKey = RemoteServiceGatewayCredentials.getApiToken(
      AvaliableApiTypes.Google
    );
    if (apiKey === "[INSERT GOOGLE TOKEN HERE]" || apiKey === "") {
      this.text.text =
        "Set your API Token in the Remote Service Gateway Credentials component to use the examples";
    } else {
      this.text.enabled = false;
    }
  }
}
