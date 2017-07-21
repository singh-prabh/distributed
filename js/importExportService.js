'use strict';

angular
  .module('fireideaz')
  .service('ImportExportService', ['FirebaseService', 'ModalService', '$filter', function (firebaseService, modalService, $filter) {
    var importExportService = {};

    importExportService.importMessages = function (userUid, importObject, messages) {
      var data = importObject.data;
      var mapping = importObject.mapping;

      for (var importIndex = 1; importIndex < data.length; importIndex++) {
        for (var mappingIndex = 0; mappingIndex < mapping.length; mappingIndex++) {
          var mapFrom = mapping[mappingIndex].mapFrom;
          var mapTo = mapping[mappingIndex].mapTo;

          if (mapFrom === -1) {
           continue;
         }

          var cardText = data[importIndex][mapFrom];

          if (cardText) {
             messages.$add({
             text: cardText,
             user_id: userUid,
             type: {
               id: mapTo
             },
             date: firebaseService.getServerTimestamp(),
             votes: 0});
          }
        }
      }

      modalService.closeAll();
    };

    importExportService.getSortFields = function(sortField) {
      return sortField === 'votes' ? ['-votes', 'date_created'] : 'date_created';
    };

    importExportService.getBoardText = function(board, messages, sortField) {
      if (board) {
        var clipboard = '';

        $(board.columns).each(function(index, column) {
          if (index === 0) {
            clipboard += '<strong>' + column.value + '</strong><br />';
          } else {
            clipboard += '<br /><strong>' + column.value + '</strong><br />';
          }

          var filteredArray = $filter('orderBy')(messages,
            importExportService.getSortFields(sortField));

          $(filteredArray).each(function(index2, message) {
            if (message.type.id === column.id) {
              clipboard += '- ' + message.text + ' (' + message.votes + ' votes) <br />';
            }
          });
        });

        return clipboard;
      }

      return '';
    };

    importExportService.submitImportFile = function (file, importObject, board, scope) {
      importObject.mapping = [];
      importObject.data = [];

      if (file) {
        if (file.size === 0) {
          importObject.error = 'The file you are trying to import seems to be empty';
          return;
        }

        /* globals Papa */
        Papa.parse(file, {
          complete: function(results) {
            if (results.data.length > 0) {
              importObject.data = results.data;

              board.columns.forEach (function (column){
                importObject.mapping.push({ mapFrom: '-1', mapTo: column.id, name: column.value });
              });

              if (results.errors.length > 0) {
                 importObject.error = results.errors[0].message;
              }

              scope.$apply();
            }
          }
        });
      }
    };

    return importExportService;
  }]);
