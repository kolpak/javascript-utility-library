$(document).ready(function () {
	$.ajaxSetup({'traditional':true});

	/*
		Case insensitive jquery-contains
	*/
	$.expr[':'].Contains = function(x, y, z){
		return jQuery(x).text().toUpperCase().indexOf(z[3].toUpperCase())>=0;
	};
	
	/*
		extend underscore: compactObject
	*/
	_.mixin({
		'compactObject' : function(o) {
			_.each(o, function(v, k){
				if (! /\S/.test(v)) {
					delete o[k];
				}
			});
			return o;
		}
	});

});
(function() {
	var method;
	var noop = function () {};
	var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
	var length = methods.length;
	var console = (window.console = window.console || {});

	while (length--) {
		!console[methods[length]] && (console[methods[length]] = noop);
    }
}());
/*
	___			-	запись в консоль
*/
function ___() {
	if (window.console && window.console.debug) {
		var tmp = $.makeArray(arguments);
		console.log(tmp.length < 2 ? tmp[0] : tmp);
	}
}
/*
	KKKKK.u	:	набор утилит
		KKKKK.u.ie			:	ИЕ у пользователя или нет
		KKKKK.u.isUndef		:	возвращает true если агрумент undefined, null или пустая строка
		KKKKK.u.has			:	returns true if object has prop (key)
		KKKKK.u.getCookie		:	возвращает значение куки по имени или весь список кук
		KKKKK.u.getQueryParams:	возвращает QueryString в виде хеша или значение по ключу
		KKKKK.u.on13			:	вызывает callback в случае если где-то в районе элемента жмакнули на Enter
		KKKKK.u.T				:	возвращает текст шаблона по его id, кеширует шаблоны
		KKKKK.u.V				:	возвращает значение по цепочке ключей
		KKKKK.u.DEFAULT		:	KKKKK.u.DEFAULT(x, y)	if x is defined return x else return y

		KKKKK.u.loadScript	:	загрузка скрипта (по умолчанию кеширующаяся) и выполнение callback-a
		KKKKK.u.loadRaw		:	загрузка произвольного файла, например библиотеки шаблонов, и выполнение callback-a
		KKKKK.u.multiload		:	загрузка набора адресов, и выполнение callback-a в результате успешного завершения всех загрузок
*/
(function() {
	var root = this;
//	!root.KKKKK && (root.KKKKK = {});

	var utils = function(obj) {
		if (obj instanceof _) return obj;
		if (!(this instanceof _)) return new _(obj);
		this._wrapped = obj;
	};

	/*
		loadScript	:	загрузка скрипта (по умолчанию кеширующаяся) и выполнение callback-a
	*/
	var loadedScripts = {};
	utils.loadScript = function(url, cb, opt){
		var _defaultAjaxSetupCache = $.ajaxSetup().cache;
		var _setAjaxSetupCache = _.has(opt || {}, 'cache') ? opt.cache : true;

		if (_setAjaxSetupCache) {
			/*
				если для этого скрипта допустимо кеширование в браузере
				проверяем, возможно этот скрипт уже загружен или поставлен в очередь загрузки
					если загружен				- запускаем cb
					если поставлен в очередь	- ожидаем подтверждения загрузки
			*/
			if (_.has(loadedScripts, url)) {
				if (loadedScripts[url] == 2) { // скрипт уже загружен. запускаем callback в отдельном "потоке"
					setTimeout(function(){
						cb.call(null, url);
					}, 1);
				} else if (loadedScripts[url] == 1) {
					var intervalId;
					intervalId = setInterval(function(){
						if (loadedScripts[url] == 2) {
							clearInterval(intervalId);
							cb.call(null, url);
						}
					}, 5);
				}
				return;
			}
			loadedScripts[url] = 1;
		}

		$.ajaxSetup({'cache': _setAjaxSetupCache});
		$.getScript(url, function() {
			loadedScripts[url] = 2;
			cb.call(null, url);
		}).fail(function(){
			banzai.error("Произошла ошибка при загрузке файла<br>" + url);
		});
		$.ajaxSetup({'cache':_defaultAjaxSetupCache});
	};
	/*
		loadRaw		:	загрузка произвольного файла, например библиотеки шаблонов, и выполнение callback-a
	*/
	var loadedRaws = {};
	utils.loadRaw = function(url, cb, opt){
		var _defaultAjaxSetupCache = $.ajaxSetup().cache;
		var _setAjaxSetupCache = _.has(opt || {}, 'cache') ? opt.cache : true;

		if (_setAjaxSetupCache) {
			/*
				если для этого файла допустимо кеширование в браузере
				проверяем, возможно этот файл уже загружен или поставлен в очередь загрузки
					если загружен				- запускаем cb
					если поставлен в очередь	- ожидаем подтверждения загрузки
			*/
			if (_.has(loadedRaws, url)) {
				if (loadedRaws[url] == 2) { // файл уже загружен. запускаем callback в отдельном "потоке"
					setTimeout(function(){
						cb.call(null, url);
					}, 0);
				} else if (loadedRaws[url] == 1) {
					var intervalId;
					intervalId = setInterval(function(){
						if (loadedRaws[url] == 2) {
							clearInterval(intervalId);
							cb.call(null, url);
						}
					}, 5);
				}
				return;
			}
			loadedRaws[url] = 1;
		}

		$.ajaxSetup({'cache': _setAjaxSetupCache});
		var el = _.has(opt || {}, 'el') ? opt.el : $('<div />');
		el.load(url, function(r, status){
			$.ajaxSetup({'cache':_defaultAjaxSetupCache});
			if (status == 'success') {
				loadedRaws[url] = 2;
				if (el.parents().length == 0) {
					el.appendTo($('body:first', document)).hide();
				}
				cb.call(null, url);
			} else {
				banzai.error("Произошла ошибка при загрузке файла<br>" + url);
			}
		});
	};
	/*
		multiload	:	загрузка набора адресов, и выполнение callback-a в результате успешного завершения всех загрузок
						загрузки выполняются асинхронно друг другу
			@param {array}		urls	список загружаемых файлов.
										если элемент списка будет массивом то сначала загрузится содержимое массива и только после этого продулжится загрузка других адресов
			@param {function}	cb		callback, который будет вызван после завершения загрузки всех файлов
			@param {hash}		opt		параметры для функций загружающих файлы (см. loadScript и loadRaw)

	*/
	utils.multiload = function(urls, cb, opt) {
		if (urls.length > 0) {
			var hash = {};
			for (var i = 0, len = urls.length; i < len; i++) {
				var url = urls[i];
				if (_.isArray(url)) {
					var splicedUrls = urls.splice(i + 1, len);
					utils.multiload(url, function(){
						utils.multiload(splicedUrls, cb, opt);
					}, opt);
					return;
				} else {
					hash[url] = 1;
					utils[/\.js/.test(url) ? 'loadScript' : 'loadRaw'](url, function(u){
						delete hash[u];
						if (_.keys(hash).length == 0) {
							cb.call();
						}
					}, opt);
				}
			}
		} else {
			cb.call();
		}
	};
	/*
		getCookie	:	возвращает значение куки по имени или весь список кук
	*/
	utils.getCookie = function(name){
		var cookies = {};
		var list = document.cookie.split('; ');
		for (var i = 0; i < list.length; i++) {
			var cookie = list[i];
			var p = cookie.indexOf('=');
			var cookieKey = cookie.substring(0, p);
			var cookieVal = cookie.substring(p + 1);
			try {
				cookies[ cookieKey ] = decodeURIComponent(cookieVal);
			} catch(e) {
				cookies[ cookieKey ] = cookieVal;
			}
		}
		return name ? cookies[name] : cookies;
	};
	/*
		getQueryParams	:   возвращает query string в виде хеша или значение по ключу
	*/
	utils.getQueryParams = function(key){
		var query = root.location.search.substring(1);
		var hash = _.chain(query.split('&'))
					.map(function(params) {
							var p = params.split('=');
							return [p[0], decodeURIComponent(p[1])];
					})
					.object()
					.value();
		delete hash[''];
		return key ? hash[key] : hash;
	};
	/*
		on13		:	вызывает callback в случае если где-то в районе элемента жмакнули на Enter
	*/
	utils.on13 = function (el, cb) {
		$(el).on('keypress', 'input:enabled,select:enabled', function(e){
			if ((e.keyCode ? e.keyCode : e.which) == 13) {
				cb.call(el, e);
			}
		});
	};
	/*
		ie			: ИЕ у пользователя или нет
	*/
	utils.ie = function() {
		if (/MSIE (\d)/.test(navigator.userAgent)) {
			return RegExp.$1;
		} else if (/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.test(navigator.userAgent)) {
			return RegExp.$1;
		}
		return false;
	};
	/*
		@function		T
		@description	возвращает текст шаблона по его id, кеширует шаблоны
	*/
	var Templates = {};
	utils.T = function(id, fatal){
		if (!id) {
			if(!fatal) {
				___("KKKKK.u.T: undefined template id -> tmpl-empty");
				id = 'tmpl-empty';
			} else {
				throw "KKKKK.u.T: undefined template id";
			}
		}
		if (! _.has(Templates, id)) {
			var tmplEl = $('#' + id);
			if (tmplEl.length == 0) {
				___("[WARNING] [utils.T] not found template id=" + id);
			}
			Templates[id] = tmplEl.html()
								.replace(/\s\/\/.+?\n/g, '')			// убираем однострочные js-комментарии
								.replace(/\n/g, ' ')					// убираем переносы строк
								.replace(/\s{2,}/g, ' ')				// убираем множественные пробелы
								.replace(/\>\s+\</g, '><')				// убираем ненужные пробелы между тегами/спецконструкциями
								.replace(/\<\!\-\-.*?\-\-\>/g, '')		// убираем html-комментарии. это ВАЖНО!
								.replace(/^\s+|\s+$/g, '');				// стряживаем начальные и концевые пробелы
		}
		return Templates[id];
	};
	/*
		@function		V
		@description	возвращает значение по цепочке ключей
		@example		KKKKK.u.V(obj, 'obj.frequency.week.d3.time')
	*/
	utils.V = function(obj, str, xw){
		var val = obj,
			keys = str.split(/\./);
		while(keys.length > 0) {
			var k = keys.shift();
			if (utils.has(val, k)) {
				val = val[k];
				if (xw && utils.has(val, 'value')) {
					val = val.value;
				}
			} else {
				val = undefined;
				break;
			}
		}
		return val;
	};
	/*
		@function		DEFAULT
		@description	KKKKK.u.DEFAULT(x, y) if x is defined return x else return y
		@example		KKKKK.u.DEFAULT(KKKKK.u.V(obj, 'obj.frequency.week.d3.time'), otherObject.otherKey, '12:00')
	*/
	utils.DEFAULT = function(){
		var val, args = _.toArray(arguments);
		while (args.length > 0) {
			val = args.shift();
			if (!utils.isUndef(val)) {
				break;
			}
		}
		return val;
	};
	/*
		@function		isUndef
		@description	returns true if value is undefined, null or ''
	*/
	utils.isUndef = function(val) {
		return val === undefined || val === null || (_.isString(val) && val === '') ? true : false;
	};
	/*
		@function		has
		@description	returns true if object has prop (key)
	*/
	utils.has = function(obj, k) {
		return (obj && (!!(Object.keys(obj).indexOf(k)+1) || (k in obj) || _.has(obj, k)));
	};

}).call(this);
