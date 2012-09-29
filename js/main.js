(function ($) {
  $(document).ready(function() {
    var cache = {};
    $("input#origen,input#destino").autocomplete({
      source: function( request, response ) {
        function filter(data, term) {
          return $.map(data, function( item ) {
            if (item.label.search(new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')) != -1) {
              return item;
            }
          });
        }
        var term = request.term;
        var term3 = request.term.substr(0, 3);
        if ( term3 in cache ) {
          response( filter(cache[ term3 ], term) );
          return;
        }
        $.ajax({
          url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%20%3D%20'http%3A%2F%2Fwww.despegar.com.ar%2FFlights.Services%2FCommons%2FAutoComplete.svc%2Fes%2F" + term3 + "'&format=json",
          dataType: "jsonp",
          success: function( data ) {
            var items = [];
            if (data.query.count == 0) return response();
            if (!$.isArray(data.query.results.json.json)) {
              items.push(data.query.results.json);
            }
            else {
              items = data.query.results.json.json;
            }
            cache[ term3 ] = $.map( items, function( item ) {
              return {
                label: item.n + " (" + item.m + ")",
                //value: item.m,
                id: item.m
              }
            });
            response( filter(cache[ term3 ], term) );
          }
        });
      },
      minLength: 3,
      select: function( event, ui ) {
        if( ui.item ) {
          $(this).val(ui.item.label);
          $('#' + $(this).attr('id') + '_id').val(ui.item.id);
        }
        if ( $( this ).attr('id') == 'origen' ) {
          $('#destino').focus();
        }
        else {
          $('#fecha_origen').focus();
        }
      },
      open: function() {
        $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
      },
      close: function() {
        $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
      }
    });

    $("input.fecha").datepicker({
      dateFormat: 'yy-mm-dd',
      numberOfMonths: 2,
      minDate: 1
    });
    $("input#fecha_origen").change(function() {
      $("input#fecha_destino").datepicker("option", "minDate", this.value);
    });
    $("input#fecha_origen").datepicker("option", "onClose", function(dateText, inst) {
      $("input#fecha_destino").datepicker("show");
    });
  });

  $("form#buscar").submit(function () {
    function date_short(date) {
        var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Deciembre"]
        var month = parseInt(date.toISOString().substr(5, 2), 10);
        var day = parseInt(date.toISOString().substr(8, 2), 10);
        return months[month-1].substr(0, 3) + ' ' + day;
    }
    function date_date(date) {
        return date.toISOString().substr( 0, 10 );
    }
    function date_range(from, to) {
      return from.toISOString().substr(0, 10) + "-" + to.toISOString().substr(0, 10);
    }

    var days = 7;
    var days_before =  Math.floor( days/2 );

    $('#resultado').html('');

    var to = new Date($("input#fecha_destino").val());
    to.setDate(to.getDate() - days_before);
    for (i = 0 ; i < days ; i++ , to.setDate(to.getDate() + 1) ) {
      if (i == 0) {
        var from = new Date($("input#fecha_origen").val());
        from.setDate(from.getDate() - days_before);
        var row = $('<div class="row"></div>');
        var div = $('<div class="span1"><p align="right">Ir</p><p>Volver</p></div>');
        row.append(div);
        for (j = 0 ; j < days ; j++ , from.setDate(from.getDate() + 1) ) {
          var div = $('<div class="span1"></div>');
          div.text(date_short(from));
          row.append(div);
        }
        $('#resultado').append(row);
      }
      var from = new Date($("input#fecha_origen").val());
      from.setDate(from.getDate() - days_before);
      $('#resultado').append('<div class="row" id="' + to.toISOString().substr(0, 10) + '"></div>' );
      var div = $('<div class="span1"></div>');
      div.text(date_short(to));
      $('#' + to.toISOString().substr(0, 10)).append(div);
      for (j = 0 ; j < days ; j++ , from.setDate(from.getDate() + 1) ) {
        if (to >= from) {
          var div = $('<div class="span1" id="' + date_range(from, to) + '">&nbsp;</div>');
          div.addClass('ui-autocomplete-loading');
          $('#' + date_date(to)).append(div);
          var url = "http://www.despegar.com.ar/shop/flights/data/search/roundtrip/" + $("#origen_id").val() + "/" + $("#destino_id").val() + "/" + date_date(from) + "/" + date_date(to) + "/1/0/0/FARE/ASCENDING/NA/NA/NA/NA/NA";
          url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D'" + encodeURIComponent(url) + "'&format=json";
          var retry = 5;
          function getFlights(url, from, to, retry) {
            $.ajax({
              from_str: from,
              to_str: to,
              url: url,
              dataType: "jsonp",
              success: function( data ) {
                console.log(data);
                if ( retry-- && data.query.count == 0 ) {
                  console.log('retrying...');
                  getFlights(url, from, to, retry);
                }
                else {
                  var despegar_url = "http://www.despegar.com.ar/shop/flights/results/roundtrip/" + $("#origen_id").val() + "/" + $("#destino_id").val() + "/" + this.from_str + "/" + this.to_str + "/1/0/0";
                  $('#' + this.from_str + '-' + this.to_str).removeClass('ui-autocomplete-loading').html('<a target="_blank" href="' + despegar_url + '">' + data.query.results.json.result.pricesSummary.bestPrice[0].formatted.mask + ' ' + data.query.results.json.result.pricesSummary.bestPrice[0].formatted.amount + '<br/>' + data.query.results.json.result.pricesSummary.bestPrice[1].formatted.mask + ' ' + data.query.results.json.result.pricesSummary.bestPrice[1].formatted.amount + '</a>' );
                }
              }
            });
          }
          getFlights(url, date_date(from), date_date(to), retry);
        }
        else {
          var div = $('<div class="span1" id="' + from.toISOString().substr(0, 10) + "-" + to.toISOString().substr(0, 10) + '">X</div>');
          $('#' + to.toISOString().substr(0, 10)).append(div);
        }
      }
    }
    return false;
  });
})(jQuery);
