#!/usr/bin/env node

import { Gitlab } from "@gitbeaker/node";
import { Command, Option } from 'commander';
import dayjs from 'dayjs';
import lo from 'lodash';

const ISO8601 = "YYYY-MM-DD";

// helper for waiting
function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

const program = new Command();
program
  .name('rollingstones')
  .requiredOption('-g, --group <id>', 'gitlab group id')
  .addOption(new Option('-s, --start <date>', 'start date - YYYY-MM-DD').default(dayjs().format(ISO8601)))
  .addOption(new Option('-e, --end <date>', 'end date - YYYY-MM-DD'))
  .addOption(new Option('-i, --interval <weeks>', 'length of sprint in weeks').default(3))
  .option('-d, --debug', 'extra debugging info')
  .option('-y, --yes', 'create the milestones')
  .version('0.0.4', '-v, --version', 'output current version')
  .addHelpText('after', '\n$GITLAB_HOST and $GITLAB_TOKEN must be set on the environment\n')
  .parse(process.argv);
const options = program.opts();

// default end is a year later
if (!options.end) {
  options.end = dayjs(options.start).add(1, 'year').format(ISO8601);
}
if (options.debug) { console.log(options); }
const { group, start, end, interval } = options;

const api = new Gitlab({
  host: process.env.GITLAB_HOST,
  token: process.env.GITLAB_TOKEN,
});

// generates the milestones periods w/ an exclusive date pattern
function generateMilestones() {

  // number of sprints is end minus start in weeks integer divided by interval
  const sprints = Math.floor(dayjs(end).diff(start, 'week') / interval);
  if (options.debug) { console.log('sprints in series', sprints, '\n'); }

  // sprint days is the interval weeks to days less one (exclusive)
  const sprint_days = (interval * 7) - 1;

  return Array(sprints).fill().map((v, i) => {
    const milestone_start = dayjs(start).add(i * interval, "weeks");
    return {
      title: `${dayjs(start).format('YY')}-${(i+1).toString().padStart(2, '0')}`,
      start_date: milestone_start.format(ISO8601),
      due_date: milestone_start.add(sprint_days, "days").format(ISO8601),
    };
  });
}

// only create milestones if they don't already exist, use the title property
async function getMilestonesToCreate(desired) {
  // get all group milestones for this group
  const groupMilestones = await api.GroupMilestones.all(group);

  // show already existing milestones in this series
  let existing = lo.intersectionBy(groupMilestones, desired, "start_date");
  if (existing.length) {
    console.log('\nMilestones in series:');
    console.table(lo.sortBy(existing, 'start_date'), ['title', 'start_date', 'due_date', 'web_url']);
  }
  return lo.differenceBy(desired, groupMilestones, "start_date");
}

async function doStuff() {
  var create = await getMilestonesToCreate(generateMilestones())
  console.log('\nMilestones to be created:');
  console.table(create);

  if (!options.yes) {
    console.log('\nShould we proceed?');
    console.log('To create the milestones, set `--yes`');
    process.exit(1);
  }

  // create milestones
  for (const milestone of create) {
    await delay(1);
    const res = await api.GroupMilestones.create(group, milestone.title, milestone);
    console.log(`Milestone created: ${res.web_url}`);
  }
}
doStuff();
