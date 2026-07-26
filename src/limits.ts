export class TokenLimits {
  maxTokens: number
  requestTokens: number
  responseTokens: number

  constructor(model = 'deepseek-v4-flash') {
    if (model === 'deepseek-v4-flash') {
      // DeepSeek-V4 Flash: fast and efficient
      this.maxTokens = 64_000
      this.responseTokens = 4000
    } else if (model === 'deepseek-v4-pro') {
      // DeepSeek-V4 Pro: more capable
      this.maxTokens = 64_000
      this.responseTokens = 4000
    } else {
      // Default for unknown models
      this.maxTokens = 64_000
      this.responseTokens = 4096
    }
    // provide some margin for the request tokens
    this.requestTokens = this.maxTokens - this.responseTokens - 100
  }

  string(): string {
    return `max_tokens=${this.maxTokens}, request_tokens=${this.requestTokens}, response_tokens=${this.responseTokens}`
  }
}
