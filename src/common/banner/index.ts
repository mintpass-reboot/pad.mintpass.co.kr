import chalk from 'chalk';
import Figlet from 'figlet';
import { isDevelopment, packageJson } from '../../';

export function showBanner(): void {
  const title = packageJson?.banner?.title ? packageJson?.banner?.title : packageJson.name;

  console.log(Figlet.textSync(title, 'Small Slant'));
  console.log();
  console.log(`${chalk.bold(title)} - ${chalk.italic(`ver. ${packageJson.version}`)}`);
  console.log(chalk.cyan(chalk.underline(packageJson.repository)));
  console.log();
  console.log(
    `Copyright © meiliNG Contributors and ${chalk.bold(
      `${chalk.cyan('Stella')} ${chalk.blue('IT')} ${chalk.magenta('Inc.')}`,
    )}`,
  );
  console.log('Distributed under MIT License');
  console.log();
}

export function devModeCheck(): void {
  if (isDevelopment) {
    console.log(
      chalk.yellow('Launching in Development mode, ') +
        chalk.bgYellowBright(chalk.black(chalk.bold(' DO NOT USE THIS IN PRODUCTION. '))),
    );
    console.log();
  }
}
