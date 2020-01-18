import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class DeployChangeSet extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        changeset: flags.Discriminated<flags.Option<string>>;
        nodialog: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
    private login;
    private gettables;
}
