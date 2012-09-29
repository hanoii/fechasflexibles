(function ($) {

  function isset () {
      // !No description available for isset. @php.js developers: Please update the function summary text file.
      //
      // version: 1109.2015
      // discuss at: http://phpjs.org/functions/isset
      // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   improved by: FremyCompany
      // +   improved by: Onno Marsman
      // +   improved by: Rafał Kukawski
      // *     example 1: isset( undefined, true);
      // *     returns 1: false
      // *     example 2: isset( 'Kevin van Zonneveld' );
      // *     returns 2: true
      var a = arguments,
          l = a.length,
          i = 0,
          undef;

      if (l === 0) {
          throw new Error('Empty isset');
      }

      while (i !== l) {
          if (a[i] === undef || a[i] === null) {
              return false;
          }
          i++;
      }
      return true;
  }

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
          var div = $('<div class="span1 result"></div>');
          div.text(date_short(from));
          row.append(div);
        }
        $('#resultado').append(row);
      }
      var from = new Date($("input#fecha_origen").val());
      from.setDate(from.getDate() - days_before);
      $('#resultado').append('<div class="row" id="' + to.toISOString().substr(0, 10) + '"></div>' );
      var div = $('<div class="span1 result"></div>');
      div.text(date_short(to));
      $('#' + to.toISOString().substr(0, 10)).append(div);
      for (j = 0 ; j < days ; j++ , from.setDate(from.getDate() + 1) ) {
        if (to >= from) {
          var div = $('<div class="span1 result" id="' + date_range(from, to) + '">&nbsp;</div>');
          div.addClass('ui-autocomplete-loading');
          $('#' + date_date(to)).append(div);
          function getFlightsDespegar(from, to, retry) {
            var url = "http://www.despegar.com.ar/shop/flights/data/search/roundtrip/" + $("#origen_id").val() + "/" + $("#destino_id").val() + "/" + from + "/" + to + "/1/0/0/FARE/ASCENDING/NA/NA/NA/NA/NA";
            url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D'" + encodeURIComponent(url) + "'&format=json";
            $.ajax({
              from_str: from,
              to_str: to,
              url: url,
              dataType: "jsonp",
              success: function( data ) {
                console.log(data);
                if ( retry-- && data.query.count == 0 ) {
                  console.log('retrying...');
                  getFlightsDespegar(from, to, retry);
                }
                else {
                  var link_url = "http://www.despegar.com.ar/shop/flights/results/roundtrip/" + $("#origen_id").val() + "/" + $("#destino_id").val() + "/" + this.from_str + "/" + this.to_str + "/1/0/0";

                  if (data.query.count == 0) {
                    $('#' + this.from_str + '-' + this.to_str).removeClass('ui-autocomplete-loading').html('<a target="_blank" href="' + link_url + '">Error</a>' );
                    return;
                  }

                  if (!isset(data.query.results.json.result.metadata)) {
                    $('#' + this.from_str + '-' + this.to_str).removeClass('ui-autocomplete-loading').html( '' );
                    return;
                  }

                  if (data.query.results.json.result.metadata.status.code != "SUCCEEDED" && data.query.results.json.result.metadata.status.code != "SUCCEEDED_RELAXED") {
                    $('#' + this.from_str + '-' + this.to_str).removeClass('ui-autocomplete-loading').html( '-' );
                    return;
                  }

                  $('#' + this.from_str + '-' + this.to_str).removeClass('ui-autocomplete-loading').html('<a target="_blank" href="' + link_url + '">' + data.query.results.json.result.pricesSummary.bestPrice[0].formatted.mask + ' ' + data.query.results.json.result.pricesSummary.bestPrice[0].formatted.amount + '<br/>' + data.query.results.json.result.pricesSummary.bestPrice[1].formatted.mask + ' ' + data.query.results.json.result.pricesSummary.bestPrice[1].formatted.amount + '</a>' );
                }
              }
            });
          }

          function getFlightsAeroMexico(from, to, retry) {
            var url = "http://ar.aeromexico.com/Flights.Services/Flights/Flights.svc/ClusteredFlights/" + $("#origen_id").val() + "/" + $("#destino_id").val() + "/" + from + "/" + to + "/1/0/0";
            url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D'" + encodeURIComponent(url) + "'&format=json&diagnostics=true";
            $.ajax({
              from_str: from,
              to_str: to,
              url: url,
              dataType: "jsonp",
              success: function( data ) {
                console.log(data);
                if ( retry-- && data.query.count == 0 ) {
                  console.log('retrying...');
                  getFlightsAeroMexico(from, to, retry);
                }
                else {
                  var link_url = "http://ar.aeromexico.com/search/flights/RoundTrip/" + $("#origen_id").val() + "/" + $("#destino_id").val() + "/" + this.from_str + "/" + this.to_str + "/1/0/0";

                  if (data.query.count == 0) {
                    $('#' + this.from_str + '-' + this.to_str).removeClass('ui-autocomplete-loading').html('<a target="_blank" href="' + link_url + '">Error</a>' );
                    return;
                  }

                  if (!isset(data.query.results.json.Boxs)) {
                    $('#' + this.from_str + '-' + this.to_str).removeClass('ui-autocomplete-loading').html( '-' );
                    return;
                  }
                  
                  if ($.isArray(data.query.results.json.Boxs)) {
                    price = data.query.results.json.Boxs[0];
                  }
                  else {
                    price = data.query.results.json.Boxs;
                  }

                  if ($.isArray(price.Itns)) {
                    price = price.Itns[0];
                  }
                  else {
                    price = price.Itns;
                  }

                  $('#' + this.from_str + '-' + this.to_str).removeClass('ui-autocomplete-loading').html('<a target="_blank" href="' + link_url + '">' + '$ ' + Math.ceil(price.OTot.Loc) + '<br/>' + 'U$S ' + Math.ceil(price.OTot.NonLoc) + '</a>' );
                }
              }
            });
          }

          if ($('#motor').val() == 'despegar') {
            getFlightsDespegar(date_date(from), date_date(to), 5);
          }
          if ($('#motor').val() == 'aeromexico') {
            getFlightsAeroMexico(date_date(from), date_date(to), 5);
          }

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
