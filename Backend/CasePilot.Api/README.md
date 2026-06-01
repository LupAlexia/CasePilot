cd Backend/CasePilot.Api
Useful terminal commands(in D:\Facultate\An_II\Sem4\MPP\Backend or Terminal):
- 'dotnet build' - to build the project
- 'dotnet run' - to run the project 
-> HTTPS on port 7154, HTTP on port 5265
- 'dotnet clean' - to clean the project

http://localhost:5265/swagger - to access the Swagger UI and test the API endpoints

Unit testing commands:
- 'dotnet test' --collect:"XPlat Code Coverage" - to run the tests
- reportgenerator -reports:CasePilot.Tests/TestResults/*/coverage.cobertura.xml -targetdir:coverage-report -reporttypes:Html
-> generate code coverage report in HTML format in the 'D:\Facultate\An_II\Sem4\MPP\Backend\coverage-report\index.html' 


Validation is done using FluentValidation library, on the DTOs (Data Transfer Objects) that are used in the API endpoints. 
The validators are defined in the 'Validators' folder and are registered in the 'Program.cs' file using the 'AddValidatorsFromAssemblyContaining' method.
Bogus library - fake data generation(Silver 2)

Integration with frontend is partly done  - Dosare
