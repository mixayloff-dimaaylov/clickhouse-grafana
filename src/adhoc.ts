const queryFilter = "database != 'system'";
const columnsQuery = "SELECT database, table, name, type FROM system.columns WHERE {filter} ORDER BY database, table";
const regexEnum = /'(?:[^']+|'')+'/gmi;

export default class AdhocCtrl {
    tagKeys: any[];
    tagValues: any[];
    datasource: any;
    query: string;

    /** @ngInject */
    constructor(datasource: any) {
        this.tagKeys = [];
        this.tagValues = [];
        this.datasource = datasource;
        let filter = queryFilter;
        if (datasource.defaultDatabase.length > 0) {
            filter =  "database = '" + datasource.defaultDatabase + "' AND " + queryFilter;
        }
        this.query = columnsQuery.replace('{filter}', filter);
    }

    GetTagKeys(){
        var self = this;
        if (this.tagKeys.length > 0) {
            return Promise.resolve(this.tagKeys);
        }
        return this.datasource.metricFindQuery(this.query)
            .then(function (response) {
                return self.processResponse(response)
            });
    }

    GetTagValues(options){
        if (this.tagValues.hasOwnProperty(options.key)) {
            return Promise.resolve(this.tagValues[options.key]);
        }
        return Promise.resolve([])
    }

    processResponse(response) {
        var self = this;
        let columnNames = {};
        response.forEach(function(item){
            let text = item.table + '.' + item.name;
            if (self.datasource.defaultDatabase.length == 0) {
                text = item.database + '.' + text;
            }
            let value = item.name;
            self.tagKeys.push({text: text, value: value});
            if (item.type.slice(0, 4) === 'Enum') {
                let options = item.type.match(regexEnum);
                if (options.length > 0) {
                    self.tagValues[text] = [];
                    options.forEach(function(o) {
                        self.tagValues[text].push({text: o, value: o})
                    });
                    self.tagValues[item.name] = self.tagValues[text];
                }
            }
            columnNames[item.name] = true;
        });
        /* Store unique column names with wildcard table */
        Object.keys(columnNames).forEach(columnName => {
            self.tagKeys.push({text: columnName, value: columnName});
        });
        return Promise.resolve(self.tagKeys);
    }
}