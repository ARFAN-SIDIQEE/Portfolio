import { CreateProjectDto } from './dto/project.dto';
import { CreateSkillDto } from './dto/skill.dto';
import { PortfolioService } from './portfolio.service';
import {
  EducationService, ExperienceService, ProfileService, ServicesService, SettingsService, SocialLinksService,
} from '../content/content.services';

export interface ContentServices {
  profile: ProfileService;
  settings: SettingsService;
  education: EducationService;
  experience: ExperienceService;
  services: ServicesService;
  socialLinks: SocialLinksService;
}

/** Seeds an empty database with the content that used to be hardcoded in the React app. */
export async function seedPortfolio(portfolio: PortfolioService, content: ContentServices) {
  if (!(await portfolio.hasProjects())) {
    const projects: CreateProjectDto[] = [{
      title: 'Fundraising System',
      description: 'Developed a fundraising system to help manage and track donations efficiently. Designed the user interface focusing on usability and simple navigation.',
      technologies: ['HTML', 'CSS', 'JavaScript'],
      status: 'completed',
      category: 'Semester Project',
      sourceUrl: 'https://github.com/ARFAN-SIDIQEE/fundraising-system',
      liveUrl: 'https://fundraising-system.vercel.app',
    }];
    await portfolio.seedProjects(projects);
  }
  if (!(await portfolio.hasSkills())) {
    const skills: CreateSkillDto[] = [
      { name: 'HTML', category: 'Technical', icon: 'fab fa-html5' },
      { name: 'CSS', category: 'Technical', icon: 'fab fa-css3-alt' },
      { name: 'JavaScript', category: 'Technical', icon: 'fab fa-js' },
      { name: 'React (Learning)', category: 'Technical', icon: 'fab fa-react' },
      { name: 'Python', category: 'Technical', icon: 'fab fa-python' },
      { name: 'Communication', category: 'Soft', icon: 'fas fa-comments' },
      { name: 'Teamwork', category: 'Soft', icon: 'fas fa-people-carry' },
      { name: 'Problem-solving', category: 'Soft', icon: 'fas fa-lightbulb' },
    ];
    await portfolio.seedSkills(skills);
  }
  await seedContent(content);
}

async function seedContent(c: ContentServices) {
  const profile = await c.profile.get();
  if (!profile.fullName) {
    await c.profile.update({
      fullName: 'Arfan Sidiqee',
      headline: 'Aspiring Front-End Developer',
      badge: 'BS Software Engineering (5th Semester)',
      heroDescription: 'I enjoy building responsive and user-friendly web applications using modern technologies. Continuously learning and improving to become a professional developer!',
      aboutParagraphs: [
        'I am a dedicated BS Software Engineering student currently in my 5th semester, with a strong interest in front-end development. I enjoy bringing ideas to life in the browser and creating intuitive digital experiences.',
        'My journey in software engineering has equipped me with a solid foundation in core web technologies, problem-solving, and teamwork. I am currently focusing on mastering React while actively seeking opportunities to gain professional experience.',
      ],
      aboutStats: [
        { value: '5th', label: 'Semester Student' },
        { icon: 'fas fa-code', label: 'Frontend Focused' },
      ],
      email: 'arfansidiqee@gmail.com',
      whatsapp: '923554450320',
    });
  }

  const settings = await c.settings.get();
  if (!settings.metaDescription) {
    await c.settings.update({
      siteTitle: 'Arfan Sidiqee | Front-End Developer',
      metaDescription: 'Portfolio of Arfan Sidiqee, front-end developer.',
      footerText: 'Built with React & Bootstrap.',
      contactIntro: "I'm always open to discussing new projects, exchanging ideas, or talking about potential roles and collaborations.",
      projectsFooterText: 'Explore more of my work and code samples on GitHub',
      sectionTitles: {
        about: 'About Me', skills: 'My Skills', projects: 'Featured Projects', services: 'Free Services',
        experience: 'Experience', education: 'Education', contact: "Let's Connect",
      },
      // Services start hidden: the admin enables them after adding real entries.
      sections: { services: false },
    });
  }

  if ((await c.education.count()) === 0) {
    await c.education.create({
      institution: 'Your university (edit in admin)',
      degree: 'BS Software Engineering',
      startDate: '',
      endDate: 'Current (5th Semester)',
      description: 'Building a strong academic foundation in software engineering principles, algorithms, and web app development technologies.',
      order: 0,
    });
  }
  if ((await c.experience.count()) === 0) {
    await c.experience.create({
      title: 'Open to Opportunities',
      company: '',
      endDate: 'Present',
      description: 'Currently seeking opportunities to gain professional experience in front-end development. Open to internships and entry-level roles where I can contribute to exciting projects.',
      order: 0,
    });
  }
  if ((await c.socialLinks.count()) === 0) {
    await c.socialLinks.create({ platform: 'GitHub', url: 'https://github.com/ARFAN-SIDIQEE', icon: 'fab fa-github', order: 0 });
    await c.socialLinks.create({ platform: 'WhatsApp', url: 'https://wa.me/923554450320', icon: 'fab fa-whatsapp', order: 1 });
  }
}
