export class TokenLimits {
  maxTokens: number
  requestTokens: number
  responseTokens: number

  constructor(model = 'deepseek-chat') {
    if (model === 'deepseek-chat') {
      // DeepSeek-V3: 64K context
      this.maxTokens = 64_000
      this.responseTokens = 4000
    } else if (model === 'deepseek-reasoner') {
      // DeepSeek-R1: 64K context
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
