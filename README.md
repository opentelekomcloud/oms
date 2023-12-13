# oms
**O**penTelekomCloud JS **m**icro-**S**DK

[![codecov.io](https://codecov.io/github/opentelekomcloud/oms/coverage.svg?branch=master)](https://codecov.io/github/opentelekomcloud/oms?branch=master)

This is JS SDK designed mostly for internal usage and for Rancher drivers' UI part (https://github.com/opentelekomcloud/ui-cluster-driver-otc)

Supports `ak/sk`, `token`, and `username/password` authentication.

#### Services list:
- Compute:
    - V1:
        - List all available flavors by `listFlavors`
    - V2:
        - List all available for user Keypairs by `listKeyPairs`
- Identity:
    - V3:
        - List available service endpoints by `listEndpoints`
        - Create permanent AK/SK by `getAKSK`
        - List available service catalog by `listCatalog`
        - List available projects (tenants) by `listProjects`
        - List available services by `listServices`
        - Get permanent auth token by `issueToken`
- Image:
    - V2:
        - List all available images by `listImages`
- Network
    - Get list of all existing VPCs by `listVPCs`
    - Create new VPC by `createVPC`
    - Get existing VPC details by `getVPC`
    - Update existing VPC by `updateVPC`
    - Delete existing VPC by `deleteVPC`
    - List existing subnets by `listSubnets`
    - Get existing subnet by ID by `getSubnet`
    - Create new subnet with given opts by `createSubnet`
    - Delete existing subnet by ID by `deleteSubnet`
    - List existing security groups by `listSecurityGroups`
    - Create new security group by `createSecurityGroup`
    - Delete existing security group by `deleteSecurityGroup`
    - List all public IPs assigned to the project by `listPublicIPs`
- Object-storage
    - V1:
        - Get AccountMetadata details and container list by `getAccount`
        - Get AccountMetadata details by `showAccountMetadata`
        - Update account metadata by `updateAccountMetadata`
        - Create container by `createContainer`
        - List all containers by `listContainers`
        - Show container metadata by `showContainerMetadata`
        - List container objects by `getContainer`
        - Delete container by `deleteContainer`

### Usage:

1. ***Create cloud config with necessary with auth url:***
  
   const authUrl = "https://iam.eu-de.otc.t-systems.com/v3"

   const config = cloud(authUrl)
2. ***Add auth type:***
   1) With AK/SK and Project:
   
      config.withAKSK("ak", "sk").withProject("projectName")
   2) With Auth token:
   
      config.withToken("token")
   3) With username and password (`region` here is mandatory):
      
      config.withRegion("region").withProject("projectName").withPassword("domainName", "username", "password")
3. ***Create client form config:***

   const client = new Client(config.config)

   await client.authenticate()
   
   const catalog = await client.getService(IdentityV3).listCatalog()

### Usage example:
Minimal usage example can be found at https://github.com/opentelekomcloud-blueprints/oms-example

### Published in NPM:
 - https://www.npmjs.com/package/@opentelekomcloud/oms

## License
Copyright 2023 T-Systems GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
