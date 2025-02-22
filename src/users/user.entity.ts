import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  email: string;

  // Aumentei o tamanho dos campos cpf e rg para a criptografia
  @Column({ unique: true, length: 255 })
  cpf: string;

  @Column({ unique: true, length: 255 })
  rg: string;

  @Column({ length: 200 })
  issuing_agency: string;

  @Column({ length: 8 })
  postal_code: string;

  @Column({ length: 100 })
  street: string;

  @Column()
  house_number: string;

  @Column({ nullable: true })
  complement: string;

  @Column({ length: 50 })
  neighborhood: string;

  @Column({ length: 50 })
  city: string;

  @Column({ length: 2 })
  state: string;

  @Column()
  password: string;

  @Column({ default: false })
  is_admin: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  job_title: string;

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
