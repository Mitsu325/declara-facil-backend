import { User } from 'src/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum SignatureType {
  DIRECTOR = 'director',
  REQUESTER = 'requester',
}

@Entity('declarations')
export class Declaration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column()
  footer: string;

  @Column({
    name: 'signature_type',
    type: 'enum',
    enum: SignatureType,
    default: SignatureType.DIRECTOR,
  })
  signatureType: SignatureType;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
