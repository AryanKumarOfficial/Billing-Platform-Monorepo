import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

export enum InvoiceStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
}

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column('uuid')
    userId: string;

    @Column()
    description: string;

    @Column('int')
    amount: number; // In cents

    @Column({
        type: 'enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.PENDING,
    })
    status: InvoiceStatus;

    @CreateDateColumn()
    createdAt: Date;
}