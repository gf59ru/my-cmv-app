/**
 * Created by borovennikov on 02.12.2014.
 */
var XLSX = require('XLSX');

var xlsx = {
	createXlsFile: function (datasource, filename, callback) {
		var wb = {};
		wb.Sheets = {};
		wb.Props = {};
		wb.SSF = {};
		wb.SheetNames = [];

		var ws = {};
		var range = {s: {c: 0, r: 0}, e: {c: 0, r: 0}};
		range.e.c = 0;

		var data = datasource._data;
		var properties;
		for (var row = 0; row < data.length; ++row) {
			if (range.e.r < row)
				range.e.r = row;
			if (!properties) {
				properties = [];
				for (var property in data[0]) {
					properties.push(property);
				}
				for (var column = 0; column < properties.length; ++column) {
					if (range.e.c < column)
						range.e.c = column;
					var cell = {v: properties[column]};
					cell.t = 's';
					var cellref = XLSX.utils.encode_cell({c: column, r: 0});
					ws[cellref] = cell;
				}
			}
			var dataRow = data[row];
			for (var column = 0; column < properties.length; ++column) {
				if (range.e.c < column)
					range.e.c = column;
				var cell = {v: dataRow[properties[column]]};

				if (typeof cell.v === 'number')
					cell.t = 'n';
				else if (typeof cell.v === 'boolean')
					cell.t = 'b';
				else
					cell.t = 's';

				var cellref = XLSX.utils.encode_cell({c: column, r: row + 1});
				ws[cellref] = cell;
			}
		}
		ws['!ref'] = XLSX.utils.encode_range(range);
		wb.SheetNames.push('my sheet');
		wb.Sheets['my sheet'] = ws;
		XLSX.writeFile(wb, './public/userfiles/' + filename);
		callback('http://geo-1/userfiles/' + filename);
	}
};

module.exports = xlsx;