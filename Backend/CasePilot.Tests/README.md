### Run only auth tests with coverage
```bash
dotnet test --filter "FullyQualifiedName~AuthServiceTests" /p:CollectCoverage=true /p:Include="[CasePilot.Api]CasePilot.Api.Services.AuthService"
```