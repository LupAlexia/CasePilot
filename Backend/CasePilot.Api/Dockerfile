# ── Build stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore first (cached layer when only source changes)
COPY CasePilot.Api.csproj ./
RUN dotnet restore CasePilot.Api.csproj

# Copy the rest and publish
COPY . ./
RUN dotnet publish CasePilot.Api.csproj -c Release -o /app /p:UseAppHost=false

# ── Runtime stage ────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

ENV ASPNETCORE_ENVIRONMENT=Production
# Render/Railway override PORT; 8080 is a sane local default.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "CasePilot.Api.dll"]
