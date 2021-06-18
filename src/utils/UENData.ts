import { Field, ObjectType } from "type-graphql";


@ObjectType()
export class UENData {
    @Field()
    uen: string;

    @Field()
    reg_street_name: string;

    @Field()
    entity_name: string;

    @Field()
    entity_type: string;

    @Field()
    reg_postal_code: string;

    @Field()
    issuance_agency_id: string;

    @Field()
    uen_issue_date: string;

    @Field()
    uen_status: string;

    constructor(uen: string, 
                reg_street_name: string, 
                entity_name: string,
                entity_type: string,
                reg_postal_code: string,
                issuance_agency_id: string,
                uen_issue_date: string,
                uen_status: string) {
        this.uen = uen;
        this.reg_street_name = reg_street_name;
        this.entity_name = entity_name;
        this.entity_type = entity_type;
        this.reg_postal_code = reg_postal_code;
        this.issuance_agency_id = issuance_agency_id;
        this.uen_issue_date = uen_issue_date;
        this.uen_status = uen_status;
    }
}
