import { CreateProjectDto } from './dto/project.dto';
import { CreateSkillDto } from './dto/skill.dto';
import { PortfolioService } from './portfolio.service';

export async function seedPortfolio(portfolio: PortfolioService) {
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
}
