/**
 * Generate Simple Form
 * @author luyuting
 */
function generateForm(options) {
	var _id = options['id'];
	var _title = options['title'];
	var _params = options['params'];
	var _async = options['async'] || false;
	var _action = options['action'];
	var _callback = _async? options['callback']: function(data) {};
	
	var _formParams = [];
	var _validate = function() {
		var params = {};
		var parLen = _formParams.length;
		for (var i = 0; i < parLen; i ++) {
			var each = _formParams[i];
			var name = each['name'];
			var regex = each['regex'];
			var id = each['id'];
				
			var node = $('#' + id);
			var val = node.val().trim();
			if (!regex.test(val)) {
				node.addClass('has-error').focus();
				return false;
			}
			params[name] = val;
		}
		if (_async) {
			$.ajax({
				type : 'post',
				url : _action,
				data : params,
				dataType : 'json',
				success : _callback,
				error : function(err) {
					var errstr = "status : " + err.status + "\nstatusText : " + err.statusText;
					alert("Error Occured !\n" + errstr);
				}
			});
		}
	};
	
	var _formArea = $('<div></div>').addClass('container form-area')
		.append($('<div></div>').text(_title).addClass('form-title'));
	var _initForm = $('<form></form>').attr('id', _id + '_form');
	_formArea.append(_initForm);
	var _init = function() {
		var baseEmpty = /^[^<|>|;|\\?|\\||'|&]*$/;
		var base = /^[^<|>|;|\\?|\\||'|&]+$/;
		var len = _params.length;
		var initParam = function(param) {
			var name = param['name'].trim();
			var display = param['display'];
			var type = param['type'];
			var regex = param['regex'] || ((param['required'] === false)? baseEmpty: base);
			var value = param['value'];
			if (type != 'assoc-select') {
				var id = _id + '_' + name;
				var item = $('<div></div>');
				item.append($('<label></label>').text(display));
				switch (type) {
					case 'input' :
						item.append($('<input type="text"/>').attr('name', name).attr('id', id)
							.attr('placeholder', value || ''));
						break;
					case 'date' :
						item.append($('<input type="date"/>').attr('name', name).attr('id', id)
							.attr('placeholder', value || ''));
						regex = /^\d{4}-\d{2}-\d{2}$/;
					break;
					case 'select' : 
						var select = $('<select></select>').attr('id', id);
						item.append(select);
						for (var j = 0; j < value.length; j ++) {
							var k = value[j]['k'] || value[j];
							var v = value[j]['v'] || value[j];
							select.append($('<option></option>').text(k).val(v))
						}
						select = null;
						break;
					case 'textarea' :
						item.append($('<textarea></textarea>').attr('name', name).attr('id', id)
							.attr('placeholder', value || ''));
						break;
					default : 
						item.append($('<input type="' + type + '"/>').attr('name', name).attr('id', id)
							.attr('placeholder', value || ''));
						break;
				}
				_formParams.push({name : name, regex : regex, id : id});
				_initForm.append(item);
			} else {
				var rate = param['rate'] || 2;
				var nameArr = name.split(',');
				var displayArr = display.split(',');
				var selects = [];
				for (var k = 0; k < nameArr.length; k ++) {
					var item = $('<div></div>');
					var id = _id + '_' + nameArr[k].trim();
					item.append($('<label></label>').text(displayArr[k].trim()));
					var select = $('<select></select>').attr('id', id).attr('index', k);
					item.append(select);
					selects.push(select);
					regex = baseEmpty;
					_initForm.append(item);
					_formParams.push({name : nameArr[k].trim(), regex : regex, id : id});
				}
				for (var j = 0; j < value.length; j ++) {
					selects[0].append($('<option></option>').text(value[j][0]).val(value[j][0]));
				}
				for (var n = 1; n < rate - 1; n ++) {
					var deepVal = value[0][n];
					for (var count = n - 1; count > 0; count --) {
						deepVal = deepVal[0];
					}
					for (var j = 0; j < deepVal.length; j ++) {
						selects[n].append($('<option></option>').text(deepVal[j]).val(deepVal[j]));
					}
				}
				var chain = [];
				for (var n = 0; n < rate - 1; n ++) {
					selects[n].bind('change', function() {
						var index = $(this)[0].selectedIndex;
						var self = parseInt($(this).attr('index'));
						chain[self] = index;
						var optionArr = value[chain[0]];
						if (self != rate - 2) {
							selects[self + 1].empty();
							var depthVal = optionArr[self + 1];
							for (var dep = 1; dep <= self; dep ++) {
								depthVal = depthVal[chain[dep]];
							}
							for (var j = 0; j < depthVal.length; j ++) {
								selects[self + 1].append($('<option></option>').text(depthVal[j]).val(depthVal[j]));
							}
							selects[self + 1].trigger('change');
						} else {
							for (var j = self + 1; j < optionArr.length; j ++) {
								selects[j].empty();
								var vals = optionArr[j];
								for (var dep = 1; dep <= self; dep ++) {
									vals = vals[chain[dep]];
								}
								for (var k = 0; k < vals.length; k ++) {
									selects[j].append($('<option></option>').text(vals[k]).val(vals[k]));
								}
							}
						}
					}).trigger('change');
				}
			}
		};
		for (var i = 0; i < len; i ++) {	
			initParam(_params[i]);
		}
		
		if (!_async) {
			_initForm.attr({action : _action, method : 'post'});
		}
		_initForm.append($('<button></button>').text('确认').attr('type', _async? 'button': 'submit').on('click', _validate))
		.append($('<button type="button"></button>').text('取消').on('click', function() {
			_initForm.empty();
			_init();
		}));
	}
	_init();
	var _appendArea = $('div.main-form-area');
	if (_appendArea.length == 0) {
		_appendArea = $('<div></div>').addClass('main-form-area');
		$('body').append(_appendArea);
	}
	$(_appendArea).append(_formArea);
	
	$(document).on('keydown', '.has-error', function() {
		$(this).removeClass('has-error');
	});
}