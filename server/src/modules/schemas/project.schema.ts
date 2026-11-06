import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  description!: string;

  @Prop({ type: [String], required: true })
  technologies!: string[];

  @Prop({ required: true, enum: ['completed', 'in-progress'], default: 'in-progress' })
  status!: 'completed' | 'in-progress';

  @Prop({ trim: true, maxlength: 80, default: 'Project' })
  category!: string;

  @Prop({ trim: true, default: '' })
  sourceUrl!: string;

  @Prop({ trim: true, default: '' })
  liveUrl!: string;

  @Prop({ trim: true, default: '' })
  imageUrl!: string;

  @Prop({ trim: true, default: '' })
  imagePublicId!: string;

  @Prop({ default: 0 })
  order!: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
