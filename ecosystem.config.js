/* eslint-disable @typescript-eslint/no-var-requires */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });
const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));

module.exports = {
  apps: [
    {
      name: packageJson.name,
      cwd: '.',
      script: 'yarn',
      args: ['start'],
      env: {
        // You should configure it here.
        NODE_ENV: 'production',

        ...process.env,
      },
    },
  ],

  deploy: {
    production: {
      user: process.env.DEPLOY_PRODUCTION_USER,
      host: process.env.DEPLOY_PRODUCTION_HOST,
      ref: 'origin/main',
      repo: 'git@github.com:meiliNG/api-template.git',
      path: process.env.DEPLOY_PRODUCTION_PATH,
      'pre-deploy-local': `scp -Cr ./.env ${process.env.DEPLOY_PRODUCTION_USER}@${process.env.DEPLOY_PRODUCTION_HOST}:${process.env.DEPLOY_PRODUCTION_PATH}/current; scp -Cr ./config.json ${process.env.DEPLOY_PRODUCTION_USER}@${process.env.DEPLOY_PRODUCTION_HOST}:${process.env.DEPLOY_PRODUCTION_PATH}/current`,
      'post-deploy': `yarn && yarn prisma generate && yarn build && pm2 startOrRestart ecosystem.config.js`,
    },
  },
};
