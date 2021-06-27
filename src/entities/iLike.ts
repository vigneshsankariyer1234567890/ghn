import { BaseEntity
    //, Column
    , PrimaryColumn
    //, PrimaryGeneratedColumn 
} from "typeorm";

export abstract class iLike extends BaseEntity {

    // @PrimaryGeneratedColumn()
    // id!: number;

    @PrimaryColumn()
    userId!: number

    // @Column({type: "boolean", default:true})
    // auditstat!: boolean;

}