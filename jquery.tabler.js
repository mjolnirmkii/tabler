/** Custom jQuery plugin for multirow table input, involving stripes
 * 
 * 	Requires:
 * 		- BlockUI (optional - if not using, make sure options includes useBlockUI : false)
 *
 *  Authors: 	Chase Putnam (chasedputnam@gmail.com) */
(function( $ ) {
	var methods = {
		init : function(options) {
			return this.each(function() {
				var settings = $.extend({}, defaultSettings, options);
				var $this = $(this); // $this refers to the table.
				if (!$this.is('table')) {
					throw 'element not a table! check your jQuery selector';
				}
				if (settings.addActionColumn) {
					$this.children('thead').children('tr').last().append('<th class="tabler_actions">Actions</th>');
					$this.children('tbody').children('tr').append('<td class="tabler_actions">' + settings.editButtonHtml + settings.saveButtonHtml + settings.deleteButtonHtml + (settings.addButtonInRow ? settings.addButtonHtml : '') + '</td>');
					if (!settings.addButtonInRow) {
						$this.after(settings.addButtonHtml);
					}
					$this.find('tr').last().addClass('last');
				}
				if (!settings.prefix) {
					settings.prefix = $this.find('input,select,textarea').first().attr('name').match(/.*\[/)[0];
				}
				$this.data('tabler', settings);
				if ($this.find(settings.addButton).length) {
					$this.find(settings.addButton).click(methods.addRow);
				}
				else {
					$this.parents('div').first().find(settings.addButton).click(methods.addRow);
				}
				$this.find(settings.saveButton).click(methods.saveRow);
				$this.find(settings.deleteButton).click(methods.deleteRow);
				$this.find(settings.editButton).click(methods.editRow);
				if (!$(settings.errorContainer).length) {
					throw 'Error container with selector ' + settings.errorContainer + ' not present';
				}
				methods.makeReadOnly.call($this.find('tbody tr').not('.last'));
				$this.addClass('tabler');
				// oppt project specific actions. we want warnings when trying to navigate away, etc.
				$('form:not(.tabler_doNotWarn)').submit(methods.checkForEditable);
				$('#actionBar div a').click(methods.checkForEditable);
				
				if (methods.countRows.call($this) == settings.limit) {
					if ($this.find(settings.addButton).length) {
						$this.find(settings.addButton).hide();
					}
					else {
						$this.parents('div').first().find(settings.addButton).hide();
					}
				}else  if(methods.countRows.call($this) > settings.limit){
					$this.find('tbody tr').last().remove();
				}
			});
		},
		countRows : function() {
			return $(this).find('tbody tr').length;
		},
		hasData : function() {
			var hasData = false;
			this.each(function() {
				var rows = $(this).find('tbody tr');
				if ((rows.find('textarea').filter(function() {
					return $(this).val();

				}).length) || (rows.find('input').not(':button,:checkbox,:file,:image,:radio,:hidden').filter('[value]').filter(function() {
					return $(this).val();

				}).length) || rows.find(':selected,:checked').filter(function() {
					return $(this).val();

				}).length) {
					hasData = true;
				}
			});
			return hasData;
		},
		hasUnsavedData: function() {
			var hasUnsavedData = false;
			this.each(function() {
				var settings = $(this).data('tabler');
				var openRows = $(this).find('tbody tr').not('.' + settings.readOnlyClass);
				if ((openRows.find('textarea').filter(function() {
					return $(this).val();

				}).length) || (openRows.find('input').not(':button,:checkbox,:file,:image,:radio,:hidden').filter('[value]').filter(function() {
					return $(this).val();

				}).length) || openRows.find(':selected,:checked').filter(function() {
					return $(this).val();

				}).length) {
					hasUnsavedData = true;
				}
			});
			return hasUnsavedData;
		},
		checkForEditable : function(event) {
			var settings = $('.tabler').first().data('tabler'); // using the settings from the first tabler
			if (methods.hasUnsavedData.call($('.tabler'))) {
				if ($.unblockUI) {
					$.unblockUI();
				}
				alert(settings.pleaseSaveMessage);
				event.stopImmediatePropagation();
				return false;
			}
		},
		clearValues : function() {
			return this.each(function() {
				var $this = $(this);
				if ($this.filter('input,textarea').not(':button,:checkbox,:file,:image,:radio').length) {
					$this.val('');
				}
				else if ($this.is(':checkbox') || $this.is('input:radio')) {
					$this.removeAttr('checked');
				}
				else if ($this.is('select')) {
					$this.find('option:selected').removeAttr('selected');
				}
				$this.removeClass('error');
			});
		},
		cloneRow : function(settings, row) {
			var newRow = row.removeClass('last').clone(true).addClass('last'); // keep event handlers
			// clear out values
			methods.clearValues.call(newRow.find('input,select,textarea'));
			// place new row.
			var $this = row.parents('table').first();
			$this.find('tbody').first().append(newRow);
			// renumber this row's inputs
			methods.renumber.call(newRow, 1);
			methods.makeEditable.call(newRow);
			if (settings.onRowAdd) {
				settings.onRowAdd.call(newRow);
			}
			if (methods.countRows.call($this) == settings.limit) {
				if ($this.find(settings.addButton).length) {
					$this.find(settings.addButton).hide();
				}
				else {
					$this.parents('div').first().find(settings.addButton).hide();
				}
			}
			
			if (settings.useBlockUI) {
				$.unblockUI();
			}
			return this;
		},
		addRow : function() {
			/* find the table, first assuming the add button is in the row, falling back to the assumption it's in
			 * in the same div */
			var $this = $(this).parents('table').first();
			if ($this.length == 0) {
				$this = $(this).parents('div').find('table').first(); // find the table
			}
			var settings = $this.data('tabler');
			if (settings.useBlockUI) {
				$.blockUI();
			}
			if (settings.saveBeforeAdd && !($this.find('tr').last().is('.' + settings.readOnlyClass))) {
				oldUseBlockUI = settings.useBlockUI;
				settings.useBlockUI = false;
				methods.saveRow.call($this.find('tr').last().children().last(), function() {
					settings.useBlockUI = oldUseBlockUI;
					if (!($this.find('tr').last().is('.' + settings.readOnlyClass))) {
						alert(settings.saveAndAddFailMessage);
						if (settings.useBlockUI) {
							$.unblockUI();
						}
					} 
					else {
						if (settings.onBeforeRowAdd) {
							settings.onBeforeRowAdd.call($this);
						}
						methods.cloneRow(settings, $this.find('tr').last());
					}
				});
			}
			else {
				if (settings.onBeforeRowAdd) {
					settings.onBeforeRowAdd.call($this);
				}
				methods.cloneRow(settings, $this.find('tr').last());
			}
		},
		renumber : function(delta) {
			var settings = this.parents('table').first().data('tabler');
			return this.each(function() {
				$(this).find('input,select,textarea').filter('[name]').each(function() {
					var $this = $(this);
					var oldName = $this.attr('name');
					// determine index
					if (oldName.indexOf(settings.prefix) != 0) {
						return;
					}
					var index = parseInt(oldName.substr(settings.prefix.length).match(/\d*/)[0]);
					var suffix = oldName.substr(settings.prefix.length).match(/\].*/)[0];
					index += delta;
					$this.attr('name', settings.prefix + index + suffix);
				});
			});
		},
		determineIndex : function() {
			var $this = $(this);
			var settings = $this.parents('table').first().data('tabler');
			var input = $this.find('input,select,textarea').filter('[name]').filter(function() {
				if ($(this).attr('name').indexOf(settings.prefix) != 0) {
					return false;
				}
				return this;
			});
			if (input.attr('name')) { 
				return parseInt(input.attr('name').substr(settings.prefix.length).match(/\d*/));
			}
			else {
				throw 'could not determine index';
			}
		},
		saveRow : function(callback) {
			var settings = $(this).parents('table').first().data('tabler');
			if (settings.useBlockUI) {
				$.blockUI();
			}
			var row = $(this).parents('tr').first();
			var successFuncs = new Array();
			successFuncs.push(function(data) {
				var errorContainer = $(settings.errorContainer).html(data);
				if (!$(settings.errorContainer).find('li').length) { // if no errors came back
					methods.makeReadOnly.call(row);
				} 
				else { // else jsp handles error class
					if (settings.scrollToErrors) {
						$(window).scrollTop(errorContainer.offset().top + settings.topOffset);
					}
				}
				if (settings.useBlockUI) {
					$.unblockUI();
				}
			});
			if (callback) {
				successFuncs.push(callback);
			}
			$.ajax('?' + settings.saveEventName + '=&rowIndex=' + methods.determineIndex.call($(this).parents('tr').first()), {
				'data'		: row.find('input,select,textarea').serialize(),
				'success'	: successFuncs,
				'type'		: 'POST'
			});
			return this;
		},
		makeReadOnly : function() {
			return this.each(function() {
				var $this = $(this);
				var settings = $this.parents('table').first().data('tabler');
				$this.find('input,textarea').attr('readonly', 'readonly');
				$this.find('input:checkbox,input:radio').attr('disabled', 'disabled');
				//$this.find('select').attr('disabled', 'disabled').combobox('destroy').combobox(); // remove this line if not using combobox
				if (settings.wordWrap) {
					$this.find('input:text').each(function() {
						$('<span class="tabler_displaySpan" />').insertAfter($(this).hide()).text($(this).val()).attr('title', $(this).val());
					});
				}
				// following line replaced with previous line due to stripes bug -- this only works b/c we use comboboxes.
				// $this.find('input:checkbox,input:radio,select').attr('disabled', 'disabled');
                if(settings.onMakeReadOnly){
                    settings.onMakeReadOnly.call($this);
                }
				return $this.addClass(settings.readOnlyClass);
			});
		},
		makeEditable : function() {
			var $this  = $(this)
            var settings = this.parents('table').first().data('tabler');
			this.find('input,select,textarea').removeAttr('readonly').removeAttr('disabled');
			this.find('.tabler_displaySpan').remove();
			if (settings.wordWrap) {
				this.find('input:text').each(function() {
					$(this).show().next().remove();
				});
			}
            if(settings.onMakeEditable){
                settings.onMakeEditable.call($this);
            }
			return this.removeClass(settings.readOnlyClass);
		},
		deleteRow : function(event) {
			if (this.length > 1) {
				throw 'Can only delete a single row at a time this way. Use clear instead if you need to delete a lot.';
			}
			$(this).each(function() {
				var $this = $(this);
				var table = $this.parents('table').first();
				var settings = table.data('tabler');
				if (event && settings.confirmDelete) {
					if (!confirm(settings.confirmDeleteMessage)) {
						return;
					}
				}
				if (settings.useBlockUI) {
					$.blockUI();
				}
				var row = $(this).parents('tr').first();
				var args = 'rowIndex=' + methods.determineIndex.apply(row);
				// may need to change to async = false if wanting to delete multiple rows. if clear() insufficient.
				$.post('?' + settings.deleteEventName + '=', args, function(result) {
					if (result != 'success') {
						alert(settings.deleteFailMessage);
					}
					else {
						if (row.siblings().length == 0) {
							if (row.hasClass(settings.readOnlyClass)) {
								methods.makeEditable.call(row);
							}
							methods.clearValues.call(row.find('input,select,textarea'));
							if (settings.useBlockUI) {
								$.unblockUI();
							}
							if (table.find(settings.addButton).length) {
								table.find(settings.addButton).last().show();
							}
							else {
								table.parents('div').first().find(settings.addButton).last().show();
							}
							return;
						}
						methods.renumber.call(row.find('~ tr'), -1); // renumber all following rows
						row.siblings().last().addClass('last');
						row.remove();
					}
					if (table.find(settings.addButton).length) {
						table.find(settings.addButton).last().show();
					}
					else {
						table.parents('div').first().find(settings.addButton).last().show();
					}
					if (settings.useBlockUI) {
						$.unblockUI();
					}
				})
				return this;
			});
		},
		/* Clears the table, make sure to clear server-side as well */
		clear : function() {
			var settings = this.data('tabler');
			this.find('tbody tr').slice(1).remove();
			var row = this.find('tbody tr');
			methods.makeEditable.call(row);
			methods.clearValues.call(row.find('input,select,textarea'));
			row.addClass('last');
            $.post('?' + settings.clearEventName + '=',null,function(result){
                if(result != 'Success'){
                    alert(settings.clearAllFailMessage);
                }
            });
		},
		editRow : function() {
			methods.makeEditable.call($(this).parents('tr').first());
		}
	};
	var defaultSettings = {
		'prefix'			:	null, 			/* autodiscover stripes name prefix when null */
		'saveEventName'		:	'saveRow',		/* save event name */
		'deleteEventName'	:	'deleteRow',	/* delete event name */
		'clearEventName'	:	'clearTable',	/* clear table event name */
		'errorContainer'	:	'#errors',		/* selector for error container */
		'saveButton'		:	'.saveRow',		/* selector for save button */
		'editButton'		:	'.editRow',		/* selector for edit button */
		'deleteButton'		:	'.deleteRow',	/* selector for delete button */
		'addButton'			:	'.addRow',		/* selector for add button */
		'onBeforeRowAdd'	:	null,			/* callback before row is added */
		'onRowAdd'			:	null,			/* callback for after row is added */
        'onClone'           :   null,           /* callback for on clone */
        'onMakeReadOnly'    :   null,           /* callback for make read only */
        'onMakeEditable'    :   null,           /* callback for make editable */
		'useBlockUI'		:	true,
		'deleteFailMessage'	:	'There was an error deleting this row. Try again or contact CDX helpdesk for assistance.',
		'pleaseSaveMessage'	:	'You have unsaved table rows on this page. Please save them or cancel changes before attempting this action.',
		'saveAndAddFailMessage':'Unable to save the row. Correct the errors to be able to add a new row.',
		'confirmDeleteMessage': 'Are you sure you want to remove this row?',
        'clearAllFailMessage': 'Clearing the table failed. Try again or contact CDX helpdesk for assistance.',
		'readOnlyClass'		:	'tabler_readOnly',
		/* Below parameters are likely to be edited per project */
		'addActionColumn'	:	true,
		'addButtonHtml'		:	'<a href="javascript:void(0)" class="addRow button"><img src="${pageContext.request.contextPath}/images/plus_16.png"></a>',
		'saveButtonHtml'	:	'<a href="javascript:void(0)" class="saveRow button"><img src="${pageContext.request.contextPath}/images/save.gif"></a>', // placeholder -- TODO: find a better icon?
		'editButtonHtml'	:	'<a href="javascript:void(0)" class="editRow button"><img src="${pageContext.request.contextPath}/images/description.gif"></a>',
		'deleteButtonHtml'	:	'<a href="javascript:void(0)" class="deleteRow button"><img src="${pageContext.request.contextPath}/images/cross.png"></a>',
		'addButtonInRow'	:	true,
		'topOffset'			:	-65,
		'confirmDelete'		:	true,
		'saveBeforeAdd'		:	true,
		'scrollToErrors'	:	true,
		'limit'				:	Infinity,
		'wordWrap'			:	true			/* use ways of making things read-only which are better for word wrapping. */
	};
	$.fn.tabler = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.tabler');
		}
	};
})( jQuery );