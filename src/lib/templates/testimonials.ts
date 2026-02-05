import type { Testimonial } from '../types';

const womenPortraits = [1, 5, 9];
const menPortraits = [52, 53, 57];

function assignPortraits(testimonials: Testimonial[]): Testimonial[] {
  let wIdx = 0;
  let mIdx = 0;
  return testimonials.map((t) => {
    const id = t.gender === 'woman' ? womenPortraits[wIdx++] : menPortraits[mIdx++];
    return { ...t, portrait: `https://i.pravatar.cc/150?img=${id}` };
  });
}

const testimonialTemplates: Record<string, Testimonial[]> = {
  'youth-development': [
    { quote: 'My daughter found her voice here. The mentors helped her discover strengths she never knew she had.', author: 'Maria Rodriguez', role: 'Parent', gender: 'woman' },
    { quote: "This program kept my son off the streets and gave him a future. He's now the first in our family going to college.", author: 'James Wilson', role: 'Parent', gender: 'man' },
    { quote: 'The skills I learned here\u2014leadership, teamwork, resilience\u2014shaped who I am today.', author: 'Aisha Thompson', role: 'Program Alumni', gender: 'woman' }
  ],
  'agriculture': [
    { quote: 'Their programs helped our family farm stay sustainable for the next generation. We finally have hope for the future.', author: 'Robert Chen', role: 'Family Farmer', gender: 'man' },
    { quote: 'They connected us with resources and training that transformed how we grow food for our community.', author: 'Sarah Mitchell', role: 'Farm Manager', gender: 'woman' },
    { quote: "Supporting farmers isn't just about crops—it's about preserving a way of life. They understand that.", author: 'David Hernandez', role: 'Agricultural Partner', gender: 'man' }
  ],
  'food-bank': [
    { quote: 'When I lost my job, they were there with food for my kids. No judgment, just help when we needed it most.', author: 'Jennifer Adams', role: 'Program Recipient', gender: 'woman' },
    { quote: "Volunteering here showed me how one meal can restore someone's dignity and hope.", author: 'Marcus Thompson', role: 'Weekly Volunteer', gender: 'man' },
    { quote: "They don't just hand out food\u2014they connect families to resources that help them get back on their feet.", author: 'Linda Park', role: 'Social Worker', gender: 'woman' }
  ],
  'education': [
    { quote: 'My students who participate in this program show remarkable improvement in confidence and academic performance.', author: 'Dr. Patricia Moore', role: 'School Principal', gender: 'woman' },
    { quote: "They gave me a tutor who believed in me when I was ready to drop out. Now I'm graduating with honors.", author: 'Carlos Rivera', role: 'Student', gender: 'man' },
    { quote: 'The literacy program helped my grandmother finally read to her grandchildren. That gift is priceless.', author: 'Keisha Brown', role: 'Family Member', gender: 'woman' }
  ],
  'environment': [
    { quote: "We've cleaned over 50 miles of riverbank together. Seeing wildlife return makes every hour worth it.", author: 'Tom Nakamura', role: 'Volunteer Coordinator', gender: 'man' },
    { quote: 'Their conservation work saved the wetlands behind our school. Now our kids learn science there every week.', author: 'Emily Foster', role: 'Teacher', gender: 'woman' },
    { quote: 'They taught our community that protecting nature and supporting local jobs can go hand in hand.', author: 'Michael Redhawk', role: 'Tribal Council Member', gender: 'man' }
  ],
  'animal-welfare': [
    { quote: "They saved Max from a hoarding situation. Three years later, he's the sweetest, most loyal companion I've ever had.", author: 'Jessica Taylor', role: 'Adopter', gender: 'woman' },
    { quote: 'Their low-cost spay program helped us reduce strays in our neighborhood by 70% in just two years.', author: 'Officer Ray Johnson', role: 'Animal Control', gender: 'man' },
    { quote: "When I couldn't afford my dog's surgery, they helped. They see animals as family, not just pets.", author: 'Grandma Rose Williams', role: 'Pet Owner', gender: 'woman' }
  ],
  'veterans': [
    { quote: 'After three deployments, I was lost. Their transition program gave me purpose and a new career.', author: 'Sergeant Mike Torres', role: 'Army Veteran', gender: 'man' },
    { quote: 'They understood what I went through without me having to explain. That peer support saved my life.', author: "Captain Sarah O'Brien", role: 'Marine Veteran', gender: 'woman' },
    { quote: "My dad finally opened up about his service after joining their group. We're closer now than we've ever been.", author: 'Daniel Washington', role: "Veteran's Son", gender: 'man' }
  ],
  'seniors': [
    { quote: "The daily visits from volunteers are the highlight of my week. They remind me I'm not forgotten.", author: 'Eleanor Patterson', role: 'Program Participant', gender: 'woman' },
    { quote: 'Mom can stay in her home because of their care services. That independence means everything to her.', author: 'Richard Kim', role: 'Family Caregiver', gender: 'man' },
    { quote: "Their meals program doesn't just feed me\u2014the delivery person checks on me every day. That's real caring.", author: 'Harold Jenkins', role: 'Meal Recipient', gender: 'man' }
  ],
  'healthcare': [
    { quote: 'They diagnosed my condition when I had no insurance and nowhere else to turn. They literally saved my life.', author: 'Maria Santos', role: 'Patient', gender: 'woman' },
    { quote: "In remote villages with no doctors, their mobile clinics are the only healthcare families can access.", author: 'Dr. James Okonkwo', role: 'Field Physician', gender: 'man' },
    { quote: 'They treated my whole family with dignity, regardless of our ability to pay.', author: 'Fatima Al-Hassan', role: 'Community Member', gender: 'woman' }
  ],
  'housing': [
    { quote: 'Building my own home alongside volunteers taught me skills and gave my kids stability for the first time.', author: 'Tanya Robinson', role: 'Homeowner', gender: 'woman' },
    { quote: "Watching a family get their keys after months of building together\u2014that's why I volunteer every Saturday.", author: 'Greg Morrison', role: 'Construction Lead', gender: 'man' },
    { quote: "They didn't just give us a house. They gave us a community that welcomed us as neighbors.", author: 'Juan & Maria Lopez', role: 'Partner Family', gender: 'woman' }
  ],
  'disaster-relief': [
    { quote: 'When the flood took everything, they were there within hours with food, water, and hope.', author: 'Barbara Nguyen', role: 'Disaster Survivor', gender: 'woman' },
    { quote: "Their volunteers helped us rebuild our home in half the time we expected. We couldn't have done it alone.", author: 'Thomas Wright', role: 'Homeowner', gender: 'man' },
    { quote: 'They stayed long after the news cameras left. That\'s when communities really need help.', author: 'Mayor Linda Cruz', role: 'Local Official', gender: 'woman' }
  ],
  'mental-health': [
    { quote: "Their counselors helped me understand that asking for help isn't weakness\u2014it's the bravest thing I've done.", author: 'Alex Morgan', role: 'Program Graduate', gender: 'woman' },
    { quote: 'The support group gave me people who truly understand what living with anxiety feels like.', author: 'Chris Patterson', role: 'Group Member', gender: 'man' },
    { quote: "They helped our family communicate again after my son's diagnosis. We're healing together now.", author: 'Diane Foster', role: 'Parent', gender: 'woman' }
  ],
  'disability-services': [
    { quote: "Their job training program helped me prove to employers\u2014and myself\u2014what I'm capable of.", author: 'Kevin Brooks', role: 'Program Graduate', gender: 'man' },
    { quote: 'They see abilities, not disabilities. That perspective changed how my daughter sees herself.', author: 'Angela Martinez', role: 'Parent', gender: 'woman' },
    { quote: 'The adaptive sports program gave me competition, teammates, and confidence I never had before.', author: 'Jasmine Lee', role: 'Athlete', gender: 'woman' }
  ],
  'refugee-immigration': [
    { quote: 'They helped us navigate a system that felt impossible. Now we have jobs, our kids are in school, and we have hope.', author: 'Ahmad & Layla Hassan', role: 'Refugee Family', gender: 'woman' },
    { quote: "Learning English here didn't just help me communicate\u2014it helped me feel like I belong.", author: 'Mei Lin Chen', role: 'ESL Student', gender: 'woman' },
    { quote: 'When we arrived with nothing, they gave us furniture, clothes, and friends. They gave us a new beginning.', author: 'Emmanuel Okafor', role: 'New Arrival', gender: 'man' }
  ],
  'lgbtq': [
    { quote: 'Finding a community that accepted me completely\u2014that was the first time I felt truly safe being myself.', author: 'Jordan Taylor', role: 'Youth Program Member', gender: 'woman' },
    { quote: 'Their support helped me come out to my family. They were there for all of us through the process.', author: 'Ryan Okonkwo', role: 'Community Member', gender: 'man' },
    { quote: 'They advocate for our rights while creating spaces where we can just be ourselves without explanation.', author: 'Sam Rivera', role: 'Long-time Member', gender: 'woman' }
  ],
  'arts-culture': [
    { quote: "The free art classes gave my daughter an outlet and a passion she'll carry her whole life.", author: 'Michelle Watson', role: 'Parent', gender: 'woman' },
    { quote: "They brought live theater to our rural town for the first time. Our kids saw possibilities they'd never imagined.", author: 'Principal Robert Graves', role: 'School Administrator', gender: 'man' },
    { quote: 'Their music program helped me process grief in ways therapy never could. Art heals.', author: 'Destiny Jackson', role: 'Program Participant', gender: 'woman' }
  ],
  'default': [
    { quote: "They showed up for our community when we needed it most\u2014not with empty promises, but with real action.", author: 'Amanda Foster', role: 'Community Leader', gender: 'woman' },
    { quote: "I've watched them turn donated dollars into changed lives, year after year. This is impact you can see.", author: 'Marcus Johnson', role: 'Board Member', gender: 'man' },
    { quote: "They do the hard work that doesn't make headlines but makes all the difference to families like mine.", author: 'Rachel Kim', role: 'Program Beneficiary', gender: 'woman' }
  ]
};

export function getTestimonials(sector: string): Testimonial[] {
  const raw = testimonialTemplates[sector] ?? testimonialTemplates['default'];
  return assignPortraits(raw);
}
