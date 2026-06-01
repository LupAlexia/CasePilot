using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CasePilot.Api.Services.External;

public class GeminiClient : IGeminiClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
        _model  = configuration["Gemini:Model"] ?? "gemini-2.5-flash";
    }

    public async Task<string> GenerateTextAsync(string prompt)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException(
                "Cheia API Gemini nu este configurată. Adăugați Gemini:ApiKey în configurație.");

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

        var requestBody = new GeminiRequest(
            new[] { new GeminiContent(new[] { new GeminiPart(prompt) }) }
        );

        var response = await _httpClient.PostAsJsonAsync(url, requestBody);

        if (!response.IsSuccessStatusCode)
        {
            var errorText = await response.Content.ReadAsStringAsync();
            var message = BuildFriendlyErrorMessage(response.StatusCode, errorText);
            throw new HttpRequestException(message);
        }

        var geminiResponse = await response.Content.ReadFromJsonAsync<GeminiResponse>();

        var text = geminiResponse?
            .Candidates?.FirstOrDefault()?
            .Content?.Parts?.FirstOrDefault()?
            .Text;

        if (string.IsNullOrWhiteSpace(text))
            throw new InvalidOperationException("Gemini nu a returnat conținut valid.");

        return text;
    }

    private static string BuildFriendlyErrorMessage(HttpStatusCode statusCode, string rawBody)
    {
        // 429: rate limit or quota exceeded — always return a clean retry message
        if (statusCode == HttpStatusCode.TooManyRequests)
            return "Limita de cereri AI a fost atinsă. Încearcă din nou în câteva secunde.";

        // For other errors, try to extract Google's "error.message" field from the JSON body
        try
        {
            using var doc = JsonDocument.Parse(rawBody);
            if (doc.RootElement.TryGetProperty("error", out var errorObj) &&
                errorObj.TryGetProperty("message", out var msgProp))
            {
                var googleMsg = msgProp.GetString();
                if (!string.IsNullOrWhiteSpace(googleMsg))
                    return $"Eroare Gemini API ({(int)statusCode}): {googleMsg}";
            }
        }
        catch
        {
            // JSON parse failed — fall through to raw text
        }

        return $"Eroare Gemini API ({(int)statusCode}): {rawBody}";
    }

    public async Task<List<string>> ListModelsAsync()
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            return new List<string> { "(API key not configured)" };

        // Try both v1 and v1beta so we see everything available for this key
        var results = new List<string>();
        foreach (var apiVersion in new[] { "v1", "v1beta" })
        {
            try
            {
                var url = $"https://generativelanguage.googleapis.com/{apiVersion}/models?key={_apiKey}&pageSize=100";
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode) continue;

                using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                if (!doc.RootElement.TryGetProperty("models", out var modelsArray)) continue;

                foreach (var m in modelsArray.EnumerateArray())
                {
                    var supportsGenerate = m.TryGetProperty("supportedGenerationMethods", out var methods) &&
                        methods.EnumerateArray().Any(x => x.GetString() == "generateContent");
                    if (!supportsGenerate) continue;

                    var name = m.TryGetProperty("name", out var n) ? n.GetString() : null;
                    if (!string.IsNullOrEmpty(name))
                        results.Add($"[{apiVersion}] {name}");
                }
            }
            catch { /* skip if this version fails */ }
        }

        return results.Count > 0 ? results : new List<string> { "(no models found — check API key)" };
    }

    // ── Internal DTO records (not exposed outside this file) ───────────────

    private record GeminiPart([property: JsonPropertyName("text")] string Text);

    private record GeminiContent(
        [property: JsonPropertyName("parts")] GeminiPart[] Parts);

    private record GeminiRequest(
        [property: JsonPropertyName("contents")] GeminiContent[] Contents);

    private record GeminiResponseContent(
        [property: JsonPropertyName("parts")] GeminiPart[]? Parts);

    private record GeminiCandidate(
        [property: JsonPropertyName("content")] GeminiResponseContent? Content);

    private record GeminiResponse(
        [property: JsonPropertyName("candidates")] GeminiCandidate[]? Candidates);
}
