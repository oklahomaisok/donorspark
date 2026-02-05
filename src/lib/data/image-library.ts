import { config } from '../config';

interface SectorImageSet {
  hero: string[];
  action: string[];
  group: string[];
}

const IMAGE_INDEX: Record<string, SectorImageSet> = {
  'youth-development': {
    hero: ['youth-dev-hero-reading-girl.jpg', 'youth-dev-hero-teen-boy.jpg'],
    action: ['youth-dev-action-mentor-bench.jpg'],
    group: ['youth-dev-group-circle.jpg'],
  },
  'youth-sports-soccer': {
    hero: ['soccer-hero-girl-kick.jpg', 'soccer-hero-young-child.jpg'],
    action: ['soccer-action-two-players.jpg'],
    group: ['soccer-group-team-huddle.jpg'],
  },
  'youth-sports-basketball': {
    hero: ['basketball-hero-teen-shot.jpg'],
    action: ['basketball-action-one-on-one.jpg'],
    group: ['basketball-group-team.jpg'],
  },
  'agriculture': {
    hero: ['agriculture-hero-farmer-plants.jpg'],
    action: ['agriculture-action-teaching.jpg'],
    group: ['agriculture-group-gardeners.jpg'],
  },
  'food-bank': {
    hero: ['foodbank-hero-volunteer.jpg'],
    action: ['foodbank-action-distribution.jpg'],
    group: ['foodbank-group-volunteers.jpg'],
  },
  'education': {
    hero: ['education-hero-student-girl.jpg'],
    action: ['education-action-reading.jpg'],
    group: ['education-group-students.jpg'],
  },
  'environment': {
    hero: ['environment-hero-cleanup.jpg'],
    action: ['environment-action-planting.jpg'],
    group: ['environment-group-volunteers.jpg'],
  },
  'animal-welfare': {
    hero: ['animal-hero-dog-volunteer.jpg'],
    action: ['animal-action-walking.jpg'],
    group: ['animal-group-volunteers-dogs.jpg'],
  },
  'veterans': {
    hero: ['veterans-hero-portrait.jpg'],
    action: ['veterans-action-connection.jpg'],
    group: ['veterans-group-together.jpg'],
  },
  'seniors': {
    hero: ['seniors-hero-woman.jpg'],
    action: ['seniors-action-walking.jpg'],
    group: ['seniors-group-friends.jpg'],
  },
  'arts-culture': {
    hero: ['arts-hero-painter.jpg'],
    action: ['arts-action-music-lesson.jpg'],
    group: ['arts-group-musicians.jpg'],
  },
  'housing': {
    hero: ['housing-hero-family-home.jpg'],
    action: ['housing-action-building.jpg'],
    group: ['housing-group-build-team.jpg'],
  },
  'healthcare': {
    hero: ['healthcare-hero-nurse.jpg'],
    action: ['healthcare-action-screening.jpg'],
    group: ['healthcare-group-team.jpg'],
  },
  'community': {
    hero: ['community-hero-leader.jpg'],
    action: ['community-action-neighbors.jpg'],
    group: ['community-group-gathering.jpg'],
  },
  'disaster-relief': {
    hero: ['disaster-hero-responder.jpg'],
    action: ['disaster-action-supplies.jpg'],
    group: ['disaster-group-team.jpg'],
  },
  'disability-services': {
    hero: ['disability-hero-woman.jpg'],
    action: ['disability-action-gardening.jpg'],
    group: ['disability-group-inclusive.jpg'],
  },
  'mental-health': {
    hero: ['mentalhealth-hero-peace.jpg'],
    action: ['mentalhealth-action-support.jpg'],
    group: ['mentalhealth-group-circle.jpg'],
  },
  'refugee-immigration': {
    hero: ['refugee-hero-mother-child.jpg'],
    action: ['refugee-action-assistance.jpg'],
    group: ['refugee-group-welcome.jpg'],
  },
  'lgbtq': {
    hero: ['lgbtq-hero-authentic.jpg'],
    action: ['lgbtq-action-volunteering.jpg'],
    group: ['lgbtq-group-community.jpg'],
  },
};

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getSectorImages(sector: string) {
  const sectorImages = IMAGE_INDEX[sector] || IMAGE_INDEX['community'];
  const fallback = IMAGE_INDEX['community'];

  return {
    hero: `${config.imageBaseUrl}/${pickRandom(sectorImages.hero) || pickRandom(fallback.hero)}`,
    action: `${config.imageBaseUrl}/${pickRandom(sectorImages.action) || pickRandom(fallback.action)}`,
    group: `${config.imageBaseUrl}/${pickRandom(sectorImages.group) || pickRandom(fallback.group)}`,
    og: `${config.imageBaseUrl}/og/${sector}-og.jpg`,
    sector,
  };
}
