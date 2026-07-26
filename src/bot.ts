import {info, warning} from '@actions/core'
import OpenAI from 'openai'
import pRetry from 'p-retry'
import {DeepSeekOptions, Options} from './options'

export interface Ids {
  parentMessageId?: string
  conversationId?: string
}

export interface JsonSchema {
  name: string
  description: string
  parameters: Record<string, any>
}

export class Bot {
  private readonly client: OpenAI

  private readonly options: Options
  private readonly deepseekOptions: DeepSeekOptions

  constructor(options: Options, deepseekOptions: DeepSeekOptions) {
    this.options = options
    this.deepseekOptions = deepseekOptions
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    })
  }

  chat = async (
    message: string,
    jsonSchema?: JsonSchema
  ): Promise<[string, Ids]> => {
    let res: [string, Ids] = ['', {}]
    try {
      res = await this.chat_(message, jsonSchema)
      return res
    } catch (e: unknown) {
      warning(`Failed to chat: ${e}`)
      return res
    }
  }

  private readonly chat_ = async (
    message: string,
    jsonSchema?: JsonSchema
  ): Promise<[string, Ids]> => {
    const start = Date.now()
    if (!message) {
      return ['', {}]
    }

    // Prepend language instruction
    message = `IMPORTANT: Entire response must be in the language with ISO code: ${this.options.language}\n\n${message}`

    if (this.options.debug) {
      info(`sending prompt: ${message}\n------------`)
      if (jsonSchema) {
        info(`Using JSON schema: ${JSON.stringify(jsonSchema)}`)
      }
    }

    let responseText = ''
    const newIds: Ids = {}

    try {
      const params: OpenAI.ChatCompletionCreateParamsNonStreaming = {
        model: this.deepseekOptions.model,
        messages: [{role: 'user', content: message}],
        temperature: this.options.deepseekModelTemperature,
        max_tokens: 4096
      }

      // If jsonSchema is provided, use function calling
      if (jsonSchema) {
        params.tools = [
          {
            type: 'function',
            function: {
              name: jsonSchema.name,
              description: jsonSchema.description,
              parameters: jsonSchema.parameters
            }
          }
        ]
        params.tool_choice = {type: 'function', function: {name: jsonSchema.name}}
      }

      const response = await pRetry(
        () => this.client.chat.completions.create(params),
        {
          retries: this.options.deepseekRetries,
          onFailedAttempt: async (error) => {
            info(`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`)
          }
        }
      )

      const choice = response.choices[0]
      if (choice?.message?.content) {
        responseText = choice.message.content
      } else if (choice?.message?.tool_calls?.[0]?.function?.arguments) {
        // Parse function calling response
        responseText = choice.message.tool_calls[0].function.arguments
      }

      newIds.conversationId = response.id
    } catch (e: unknown) {
      info(`failed to send message to DeepSeek: ${e}`)
    }

    const end = Date.now()
    info(
      `DeepSeek sendMessage (including retries) response time: ${end - start} ms`
    )

    if (this.options.debug) {
      info(`DeepSeek responses: ${responseText}\n-----------`)
    }

    return [responseText, newIds]
  }
}
