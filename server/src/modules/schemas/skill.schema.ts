import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SkillDocument = HydratedDocument<Skill>;

@Schema({ timestamps: true })
export class Skill {
  @Prop({ required: true, trim: true, maxlength: 80 })
  name!: string;

  @Prop({ required: true, enum: ['Technical', 'Soft'] })
  category!: 'Technical' | 'Soft';

  @Prop({ trim: true, maxlength: 80, default: 'fas fa-star' })
  icon!: string;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);
