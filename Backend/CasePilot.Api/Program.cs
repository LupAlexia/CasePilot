using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using CasePilot.Api.Storage;
using CasePilot.Api.Services;
using CasePilot.Api.Services.External;
using CasePilot.Api.Services.Interfaces;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── HTTPS / Kestrel ─────────────────────────────────────────
builder.WebHost.ConfigureKestrel(options =>
{
    // In the cloud (Render/Railway) the platform injects PORT and terminates TLS
    // at its edge, so we bind plain HTTP on that single port.
    var port = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(port))
    {
        options.ListenAnyIP(int.Parse(port));
    }
    else
    {
        // Local development: HTTP + HTTPS via the dev cert.
        options.ListenAnyIP(5265);
        options.ListenAnyIP(7154, listenOptions =>
        {
            listenOptions.UseHttps();   // uses the dev cert
        });
    }
});

const string FrontendPolicy = "FrontendPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendPolicy, policy =>
    {
        policy
            /*
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "https://localhost:5173",
                "https://localhost:5174")
            */
            .SetIsOriginAllowed(origin => true) // Permite accesul de pe ORICE IP/Domeniu
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ── JWT Authentication ──────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key is not configured in appsettings.json");
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

    });

builder.Services.AddAuthorization();

// Database
builder.Services.AddDbContext<CasePilotDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repos + existing services
builder.Services.AddScoped<ILegalCaseRepository, LegalCaseRepository>();
builder.Services.AddScoped<ILegalCaseService, LegalCaseService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();
builder.Services.AddScoped<ICaseDocumentService, CaseDocumentService>();
builder.Services.AddHostedService<ActivityCleanupService>();
builder.Services.AddHostedService<HearingReminderService>();

// Auth + admin services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IThreatDetectionService, ThreatDetectionService>();

// ── Email service ────────────────────────────────────────────
builder.Services.AddSingleton<IEmailService, ResendEmailService>();

// ── AI services ─────────────────────────────────────────────
builder.Services.AddHttpClient<IGeminiClient, GeminiClient>();
builder.Services.AddScoped<IAiService, AiService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CasePilotDbContext>();
    var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    db.Database.Migrate();
    await DemoDataSeeder.SeedAsync(db, env.ContentRootPath);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(FrontendPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "CasePilot API is running.");
app.MapControllers();

app.Run();
