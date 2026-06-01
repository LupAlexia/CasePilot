namespace CasePilot.Api.Services.External;

public interface IGeminiClient
{
    /// <summary>
    /// Sends <paramref name="prompt"/> to Gemini and returns the generated text.
    /// Throws <see cref="InvalidOperationException"/> when the API key is missing.
    /// Throws <see cref="HttpRequestException"/> on API error.
    /// </summary>
    Task<string> GenerateTextAsync(string prompt);

    /// <summary>
    /// Returns the names of all models available for this API key that support generateContent.
    /// Useful for diagnosing which model names are actually usable.
    /// </summary>
    Task<List<string>> ListModelsAsync();
}
