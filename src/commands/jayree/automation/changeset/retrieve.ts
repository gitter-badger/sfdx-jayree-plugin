import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { prompt, QuestionCollection } from 'inquirer';
import puppeteer = require('puppeteer');
import { serializeError } from 'serialize-error';
import * as shell from 'shelljs';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'deploychangeset');
export default class DeployChangeSet extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:automation:changeset:deploy -s ChangeSet -l RunLocalTests --nodialog
Deploying Change Set 'ChangeSet'...

=== Status
Status: Pending
jobid:  0Xxx100000xx1x1
`,
    `$ sfdx jayree:automation:changeset:deploy
? Change Sets Awaiting Deployment (Use arrow keys)
 ChangeSet3
 ChangeSet2
❯ ChangeSet1
`
  ];

  protected static flagsConfig = {
    changeset: flags.string({
      char: 's',
      description: messages.getMessage('changesetFlagDescription'),
      required: false
    }),
    nodialog: flags.boolean({
      description: messages.getMessage('nodialogFlagDescription'),
      required: false,
      dependsOn: ['changeset']
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const conn = this.org.getConnection();

    const browser = await puppeteer.launch({
      headless: true
    });

    let output;

    try {
      const page = await browser.newPage();

      await this.login(conn, page);

      await page.goto(conn.instanceUrl + '/changemgmt/listOutboundChangeSet.apexp', {
        waitUntil: 'networkidle2'
      });

      const tables = await this.gettables(page);

      let sCS;

      if (!this.flags.nodialog) {
        const questions = [
          {
            type: 'list',
            message: 'Available Outbound Change Sets',
            name: 'selectedChangeSet',
            choices: tables.cs.map(element => ({
              value: element.Name,
              name: element.Description
                ? `${element.Name} - ${element.Status} - ${element.ModifiedBy} - ${element.ModifiedDate} - ${element.Description}`
                : `${element.Name} - ${element.Status} - ${element.ModifiedBy} - ${element.ModifiedDate}`,
              short: element.Name
            })),
            default: this.flags.changeset
          }
        ] as QuestionCollection;

        sCS = await prompt(questions).then(answers => {
          return answers;
        });
      } else {
        sCS = {
          selectedChangeSet: this.flags.changeset
        };
      }

      // console.log(sCS);
      const changeset = tables.cs.filter(element => sCS.selectedChangeSet.includes(element.Name))[0];
      // for await (const changeset of tables.csad.filter(element => sCS.selectedChangeSet.includes(element['Change Set Name']))) {
      // console.log(changeset);
      if (!changeset) {
        throw Error(`Change Set '${sCS.selectedChangeSet}' not found!`);
      }

      const json = raw => {
        try {
          return JSON.parse(raw).result;
        } catch (error) {
          return JSON.parse(raw.stderr);
        }
      };

      output = json(
        shell.exec(
          `sfdx force:source:retrieve --packagenames='${
            changeset.Name
          }' --targetusername=${this.org.getUsername()} --json`,
          { fatal: false, silent: true, env: { ...process.env, FORCE_COLOR: 0 } }
        )
      );

      this.ux.styledHeader('Retrieved Packages');
      this.ux.log(`${changeset.Name} package converted and retrieved to: ${output.packages[0].path}`);
    } catch (error) {
      this.logger.error({ error: serializeError(error) });
      throw error;
    } finally {
      await browser.close();
    }

    return output;
  }

  private async login(conn: core.Connection, page: puppeteer.Page) {
    await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
      waitUntil: 'networkidle2'
    });
  }

  private async gettables(page: puppeteer.Page) {
    return await page.evaluate(() => {
      const converttable = (document: Document, tableid: string) => {
        const rows = [];
        if (typeof document.getElementById(tableid) !== 'undefined' && document.getElementById(tableid)) {
          const table = document.getElementById(tableid) as HTMLTableElement;
          console.log(table);
          for (let r = 1, n = table.rows.length; r < n; r++) {
            const cells = {};
            for (let c = 1, m = table.rows[r].cells.length; c < m; c++) {
              cells[table.rows[0].cells[c].innerText.replace(/(\n|\t| )/g, '')] = table.rows[r].cells[
                c
              ].innerText.replace(/(:\t|\t)/g, '');
              if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Description') {
                cells['HTMLDescription'] = table.rows[r].cells[c].innerHTML;
              }
            }
            rows.push(cells);
          }
        }
        return rows;
      };
      return {
        cs: converttable(
          document,
          'ListOutboundChangeSetPage:listOutboundChangeSetPageBody:listOutboundChangeSetPageBody:ListOutboundChangeSetForm:ListOutboundChangeSetPageBlock:ListOutboundChangeSetBlockSection:OutboundChangeSetList'
        )
      };
    });
  }
}
