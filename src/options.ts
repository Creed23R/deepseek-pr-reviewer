import {info} from '@actions/core'
import {minimatch} from 'minimatch'
import {TokenLimits} from './limits'

export class Options {
  debug: boolean
  disableReview: boolean
  disableReleaseNotes: boolean
  onlyAllowCollaborator: boolean
  maxFiles: number
  reviewSimpleChanges: boolean
  reviewCommentLGTM: boolean
  pathFilters: PathFilter
  systemMessage: string
  reviewFileDiff: string
  deepseekLightModel: string
  deepseekHeavyModel: string
  deepseekModelTemperature: number
  deepseekRetries: number
  deepseekConcurrencyLimit: number
  githubConcurrencyLimit: number
  lightTokenLimits: TokenLimits
  heavyTokenLimits: TokenLimits
  language: string
  ignoreKeyword: string

  constructor(
    debug: boolean,
    disableReview: boolean,
    disableReleaseNotes: boolean,
    onlyAllowCollaborator: boolean,
    maxFiles = '0',
    reviewSimpleChanges = false,
    reviewCommentLGTM = false,
    pathFilters: string[] | null = null,
    systemMessage = '',
    reviewFileDiff = '',
    deepseekLightModel: string,
    deepseekHeavyModel: string,
    deepseekModelTemperature = '0.0',
    deepseekRetries = '3',
    deepseekConcurrencyLimit = '6',
    githubConcurrencyLimit = '6',
    language = 'en-US',
    ignoreKeyword = '/reviewbot: ignore'
  ) {
    this.debug = debug
    this.disableReview = disableReview
    this.disableReleaseNotes = disableReleaseNotes
    this.onlyAllowCollaborator = onlyAllowCollaborator
    this.maxFiles = parseInt(maxFiles)
    this.reviewSimpleChanges = reviewSimpleChanges
    this.reviewCommentLGTM = reviewCommentLGTM
    this.pathFilters = new PathFilter(pathFilters)
    this.systemMessage = systemMessage
    this.reviewFileDiff = reviewFileDiff
    this.deepseekLightModel = deepseekLightModel
    this.deepseekHeavyModel = deepseekHeavyModel
    this.deepseekModelTemperature = parseFloat(deepseekModelTemperature)
    this.deepseekRetries = parseInt(deepseekRetries)
    this.deepseekConcurrencyLimit = parseInt(deepseekConcurrencyLimit)
    this.githubConcurrencyLimit = parseInt(githubConcurrencyLimit)
    this.lightTokenLimits = new TokenLimits(deepseekLightModel)
    this.heavyTokenLimits = new TokenLimits(deepseekHeavyModel)
    this.language = language
    this.ignoreKeyword = ignoreKeyword
  }

  // print all options using core.info
  print(): void {
    info(`debug: ${this.debug}`)
    info(`disable_review: ${this.disableReview}`)
    info(`disable_release_notes: ${this.disableReleaseNotes}`)
    info(`only_allow_collaborator: ${this.onlyAllowCollaborator}`)
    info(`max_files: ${this.maxFiles}`)
    info(`review_simple_changes: ${this.reviewSimpleChanges}`)
    info(`review_comment_lgtm: ${this.reviewCommentLGTM}`)
    info(`path_filters: ${this.pathFilters}`)
    info(`system_message: ${this.systemMessage}`)
    info(`review_file_diff: ${this.reviewFileDiff}`)
    info(`deepseek_light_model: ${this.deepseekLightModel}`)
    info(`deepseek_heavy_model: ${this.deepseekHeavyModel}`)
    info(`deepseek_model_temperature: ${this.deepseekModelTemperature}`)
    info(`deepseek_retries: ${this.deepseekRetries}`)
    info(`deepseek_concurrency_limit: ${this.deepseekConcurrencyLimit}`)
    info(`github_concurrency_limit: ${this.githubConcurrencyLimit}`)
    info(`summary_token_limits: ${this.lightTokenLimits.string()}`)
    info(`review_token_limits: ${this.heavyTokenLimits.string()}`)
    info(`language: ${this.language}`)
    info(`ignore_keyword: ${this.ignoreKeyword}`)
  }

  checkPath(path: string): boolean {
    const ok = this.pathFilters.check(path)
    info(`checking path: ${path} => ${ok}`)
    return ok
  }
}

export class PathFilter {
  private readonly rules: Array<[string /* rule */, boolean /* exclude */]>

  constructor(rules: string[] | null = null) {
    this.rules = []
    if (rules != null) {
      for (const rule of rules) {
        const trimmed = rule?.trim()
        if (trimmed) {
          if (trimmed.startsWith('!')) {
            this.rules.push([trimmed.substring(1).trim(), true])
          } else {
            this.rules.push([trimmed, false])
          }
        }
      }
    }
  }

  /**
   * Returns true if the file should be processed, not ignored.
   * If there is any inclusion rule set, a file is included when it matches any of inclusion rule.
   * If there is no inclusion rule set, a file is included when it does not matches any of exclusion rule.
   */
  check(path: string): boolean {
    if (this.rules.length === 0) {
      return true
    }

    let included = false
    let excluded = false
    let inclusionRuleExists = false

    for (const [rule, exclude] of this.rules) {
      if (minimatch(path, rule)) {
        if (exclude) {
          excluded = true
        } else {
          included = true
        }
      }
      if (!exclude) {
        inclusionRuleExists = true
      }
    }

    return (!inclusionRuleExists || included) && !excluded
  }
}

export class DeepSeekOptions {
  model: string
  tokenLimits: TokenLimits

  constructor(
    model = 'deepseek-chat',
    tokenLimits: TokenLimits | null = null
  ) {
    this.model = model
    if (tokenLimits != null) {
      this.tokenLimits = tokenLimits
    } else {
      this.tokenLimits = new TokenLimits(model)
    }
  }
}
