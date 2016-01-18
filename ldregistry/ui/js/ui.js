// Set of initialization actions run on page load to make UI features live

$(function() {

    // Move any rhs elements (typically from type-specific templates) to rhs column
    $(".rhs").appendTo("#rhs");

    // Enable datatable processing
    $('.datatable').dataTable();
    
    // Query forms run a target query and load the resulting HTML into a data-result element
    var processQueryForms = function() {
        $(".query-form").each(function() {
            var target = $(this).attr('data-target');
            var queryField = $(this).attr('data-query');
            var resultField = $(this).attr('data-result');
            $(this).submit( function(){
                var url = target + $(queryField).val();
                $(resultField).load(url);
                return false;
            });
        });
    };

    processQueryForms();

    // Activate the hidable metadata tab area
    $('#pillstack li a').click(function (e) {
        e.preventDefault();
        $('#description').removeClass('col-md-10').addClass('col-md-5');
        $('#metadata-pane').removeClass('hide');
        $('#close-pillstack').removeClass('hide');
        $(this).tab('show');
    });

    $('#close-pillstack').click(function (e) {
        e.preventDefault();
        $('#description').removeClass('col-md-5').addClass('col-md-10');
        $('#metadata-pane').addClass('hide');
        $('#close-pillstack').addClass('hide');
        $('#pillstack li a[href="#collapse-tab"]').tab('show');
    });

    // Set up ajax loading tabs
    $('.action-tab').bind('show.bs.tab', function(e) {
        var pattern=/#.+/gi
        var contentID = e.target.toString().match(pattern)[0];
        var action = $(contentID).attr('data-action');
        var uri = $(contentID).attr('data-uri');
        var uiroot = $(contentID).attr('data-uiroot');
        if (action) {
          //var url = '$uiroot/' + action +'?uri=$lib.pathEncode($uri)&requestor=$requestor';
          var url = uiroot + '/' + action + '?uri=' + uri;
          var args = $(contentID).attr('data-args');
          if (args) {
             url = url + "&" + args;
          }
          $(contentID).load(url, function(){
             $('.action-tab').tab(); //reinitialize tabs
             $('.datatable').dataTable();
             processQueryForms();
           });
        };
     });


    // Anything marked as popinfo will have a popover (data-trigger, data-placement, data-content)
    // enable popups
    $(".popinfo").popover();

    // General ajax forms which reload the page when actioned. Errors are displayed in elts of class "ajax-error".
    $(".ajax-form").each(function(){
        var form = $(this);
        var returnURL = form.attr('data-return');
        form. ajaxForm({
            success:
                function(data, status, xhr){
                    if (returnURL) {
                        window.location.href = returnURL;
                    } else {
                      location.reload();
                    }
                },

            error:
              function(xhr, status, error){
                 $(".ajax-error").html("<div class='alert alert-warning'> <button type='button' class='close' data-dismiss='alert'>&times;</button>Action failed: " + error + " - " + xhr.responseText + "</div>");
              }
          });
    });

    // Simple ajax inline forms that display the returned message
    $(".ajax-inline-form").ajaxForm({
      success:
          function(data, status, xhr){
             $("#form-result").html(data);
          },

      error:
        function(xhr, status, error){
           $("#form-result").html("<div class='alert'> <button type='button' class='close' data-dismiss='alert'>&times;</button>Action failed: " + error + " - " + xhr.responseText + "</div>");
        }
    });

    // Hierarchicall views
    var hlistHandler = function(event) {
        var button = $(event.target).closest("a");
        var parent = button.closest("div");
        var state = button.attr("data-state");
        if (state === "new") {
            $.get(button.attr("data-target"), function(data){
                parent.after("<div class='hlist-child-box'>" + data + "</div>");    
                parent.next("div").find("a.hlist-button").click(hlistHandler);
            });
            setHlistState(button, "open");
        } else if (state === "open") {
            parent.next("div.hlist-child-box").hide();
            setHlistState(button, "closed");
        } else if (state === "closed") {
            parent.next("div.hlist-child-box").show();
            setHlistState(button, "open");
        }
    };

    var setHlistState = function(button, state) {
        button.attr("data-state", state);
        if (state === "open") {
            button.find("span").removeClass("glyphicon-plus-sign").addClass("glyphicon-minus-sign");            
        } else if (state === "closed") {
            button.find("span").removeClass("glyphicon-minus-sign").addClass("glyphicon-plus-sign");
        }
    };
    
    $("a.hlist-button").click( hlistHandler );

    // ------------
    // Edit support
    // ------------

    // Set up editable fields
    $.fn.editable.defaults.mode = 'inline';

    var editTarget = function(event) {
        return $(event.target).closest("button").attr("data-target");
    }

    var editRemoveAction = function(e){
        var rowid = editTarget(e);
        $(rowid).remove();
    };

    // Machinery to run edit-form interactions
    var makeEditCell = function(name, value) {
        return '<td><a href="#" class="ui-editable" data-type="text" data-inputclass="input-large" data-name="' + name + '">' + value + '</a></td>';
    }
    var makeEditRow = function(id, prop, value) {
        var row =
            '<tr id="$id">' + makeEditCell("prop", prop) + makeEditCell(prop, value)
            + '<td><button class="edit-remove-row  btn btn-sm" data-target="#$id"><span class="glyphicon glyphicon-minus-sign"></span></button>   \n'
            +     '<button class="edit-add-row btn btn-sm" data-target="#$id"><span class="glyphicon glyphicon-plus-sign"></span></button></td></tr>';
        row = row.replace(/\$id/g, id);
        return row;
    };

    var installEditRow = function(position, id, prop, value) {
        position.after( makeEditRow(id, prop, '') );
        $("#" + id).each(function(){
            $(this).find(".ui-editable").editable();
            $(this).find(".edit-remove-row").click( editRemoveAction );
            $(this).find(".edit-add-row").click( editAddAction );
            $(this).find('.ui-editable[data-name="prop"]').on('save', function(){
                var that = this;
                setTimeout(function() {
                    $(that).closest('td').next().find('.ui-editable').editable('show');
                }, 200);
            });
        });
    };

    var idcount = 1;

    var editAddAction = function(e){
        var row = $( editTarget(e) );
        var newid = row.attr("id") + idcount++;
        var prop = row.find("td:first").text();
        installEditRow(row, newid, prop, '""');
        return false;
    }

    var editAddNewAction = function(e) {
        var tableid = editTarget(e);
        var lastrow = $(tableid).find("tbody tr:last");
        var newid =  (tableid.replace(/^#/,'')) + "-newrow-"+ idcount++;
        installEditRow(lastrow, newid, '', '');
        return false;
    }

    $(".ui-editable").editable();
    $(".edit-remove-row").click( editRemoveAction );
    $(".edit-add-row").click( editAddAction );
    $(".edit-add-newrow").click( editAddNewAction );

    var emit = function(valin) {
        var val = $.trim(valin);
        var ch = val.charAt(0);
        if (ch === '[' || ch === '<' || ch === '"' || ch === "'") {
            return val;     // Already looks like Turtle
        }
        if (val.match(/^https?:/)) {
            return "<" + val + ">";
        } if (val.match(/^[+-]?[0-9]*(\.[0-9]+)?$/)) {
            return val;     // number
        } if (val.match(/^[a-zA-Z][\w\d\.]*:[\w\d\.:]*$/)) {
            return val;     // prefixed
        } else {
            return '"""' + val + '"""';
        }
    };

    // Implement edit save-changes functionality
    $(".edit-table-save").click( function(){
        var returnURL = $(this).attr("data-return");
        var isItem = $(this).attr("data-isitem");
        if (isItem) {
            isItem = isItem.toLowerCase() === "true";
        }
        var table = $("#edit-table");
        var data = $("#edit-prefixes").text();
        var url = table.attr("data-target");
        data = data + "\n<" + table.attr("data-root") + ">\n";
        table.find("tbody tr").each(function(){
            var row = $(this).find("td").toArray();
            var prop = emit($(row[0]).text());
            var value = emit( $(row[1]).text() );
            data = data + "    " + prop + " " + value + " ;\n";
        });
        $.ajax({
            type: (isItem ? "PATCH" : "PUT"),
            url: url,
            data: data,
            contentType: "text/turtle",
            success: function(){
                $("#msg").html("Submitted successfully");
                $('#msg-alert').removeClass('alert-warning').addClass('alert-success').show();
                window.location.href = returnURL;
            },
            error: function(xhr, status, error){
                $("#msg").html("Save failed: " + error + " - " + xhr.responseText);
                $('#msg-alert').removeClass('alert-success').addClass('alert-warning').show();
            }
          });
    });
});

// Should probably put this in a module
var showMetadataTab = function(tabname) {
    $('#description').removeClass('col-md-10').addClass('col-md-5');
    $('#metadata-pane').removeClass('hide');
    $('#close-pillstack').removeClass('hide');
    $('#pillstack li a[href="#' + tabname + '"]').tab('show');
};
