import { Gitlab } from "@gitbeaker/node";
import dayjs from 'dayjs';
import lo from 'lodash';

const ISO8601 = "YYYY-MM-DD";

// helper for waiting
function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

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

var create = await getMilestonesToCreate(generateMilestones())
console.log('\nMilestones to be created:');
console.table(create, ['title', 'start_date', 'due_date']);
console.log();

const proceed = process.argv.includes('--yes');
if (!proceed) {
  console.log('Should we proceed?')
  console.log('To create the milestones, set `--yes`');
  process.exit(1);
}

// create milestones
for (const milestone of create) {
  await delay(1);
  const { id, title } = milestone;
  const res = await api.GroupMilestones.create(id, title, milestone);
  console.log(`Milestone created: ${res.web_url}`);
}
