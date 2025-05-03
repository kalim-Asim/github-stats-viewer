import chalk from 'chalk';
import figlet from 'figlet';
import { Command } from 'commander';
import axios from 'axios';
import ora from 'ora';
import Table from 'cli-table3';

interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

interface GitHubRepo {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
}

async function fetchUserData(username: string): Promise<GitHubUser> {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`User '${username}' not found on GitHub`);
    }
    throw new Error('Failed to fetch user data from GitHub API');
  }
}

async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch repository data from GitHub API');
  }
}

function displayUserInfo(userData: GitHubUser): void {
  console.log(chalk.bold('\nUser Information:'));
  console.log(chalk.blue(`Username: ${userData.login}`));
  
  if (userData.name) {
    console.log(chalk.blue(`Name: ${userData.name}`));
  }
  
  if (userData.bio) {
    console.log(chalk.blue(`Bio: ${userData.bio}`));
  }
  
  console.log(chalk.blue(`Profile URL: ${userData.html_url}`));
  console.log(chalk.blue(`Account Created: ${new Date(userData.created_at).toLocaleDateString()}`));
  
  console.log(chalk.bold('\nStats:'));
  console.log(chalk.green(`Public Repositories: ${userData.public_repos}`));
  console.log(chalk.green(`Followers: ${userData.followers}`));
  console.log(chalk.green(`Following: ${userData.following}`));
}

function displayRepoInfo(repos: GitHubRepo[]): void {
  if (repos.length === 0) {
    console.log(chalk.yellow('\nNo repositories found.'));
    return;
  }

  console.log(chalk.bold('\nTop 5 Repositories:'));
  
  const table = new Table({
    head: [
      chalk.white.bold('Repository'),
      chalk.white.bold('Description'),
      chalk.white.bold('Stars'),
      chalk.white.bold('Forks'),
      chalk.white.bold('Language')
    ],
    colWidths: [20, 30, 10, 10, 15]
  });

  repos.forEach(repo => {
    table.push([
      chalk.cyan(repo.name),
      repo.description ? repo.description.substring(0, 27) + (repo.description.length > 27 ? '...' : '') : '',
      repo.stargazers_count,
      repo.forks_count,
      repo.language || 'N/A'
    ]);
  });

  console.log(table.toString());
}

async function run(): Promise<void> {
  console.log(
    chalk.yellow(
      figlet.textSync('GitHub Stats', { horizontalLayout: 'full' })
    )
  );

  const program = new Command();
  
  program
    .version('1.0.0')
    .description('A CLI tool to view GitHub user statistics')
    .argument('<username>', 'GitHub username to fetch stats for')
    .action(async (username) => {
      const spinner = ora('Fetching GitHub data...').start();
      
      try {
        const userData = await fetchUserData(username);
        const userRepos = await fetchUserRepos(username);
        
        spinner.succeed('Data fetched successfully!');
        
        displayUserInfo(userData);
        displayRepoInfo(userRepos);
      } catch (error) {
        spinner.fail((error as Error).message);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

run();