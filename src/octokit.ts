import {getInput} from '@actions/core'
import {Octokit} from '@octokit/action'

const token = getInput('token') || process.env.GITHUB_TOKEN

export const octokit = new Octokit({
  auth: `token ${token}`
})
