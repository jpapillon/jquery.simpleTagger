/* http://github.com/jpapillon/jquery.tagger */
/* global jQuery, $ */
(function ($) {
  'use strict';

  // Plugin defaults
  var defaultOptions = {
    confirmDelete: false,
    maxNbTags: false,
  };

  function Tagger(elem, options) {
    this.options = options;

    this.$select = elem;
    this.$select.hide();

    // Wrap everything under a container
    this.$select.wrapAll($('<div class="tagger-container"></div>'));
    this.$container = elem.parents(".tagger-container");

    // Add input text box
    this.$input = $('<input type="text" />');
    this.$select.after(this.$input);

    // Add values set in the options
    var self = this;
    this.$select.find("option").each(function() {
      self.addTag($(this).val());
    });

    this.setEvents();
  };

  Tagger.prototype = {
    constructor: Tagger,

    getTags: function() {
      var tags = [];
      this.$container.find(".tagger-tag").each(function() {
        tags.push($(this).data("value"));
      });
      return tags;
    },

    removeTag: function(value) {
      this.$container.find(".tagger-tag").filter(function() { return $.data(this, "value") === value; }).remove();
    },

    removeTags: function() {
      this.$container.find(".tagger-tag").remove();
    },

    setTags: function(tags) {
      this.removeTags();
      for (var i = 0; i < tags.length; i++) {
        this.addTag(tags[i]);
      }
    },

    reachedNbMaxTags: function() {
      return this.options.maxNbTags && this.getTags().length >= this.options.maxNbTags;
    },

    setEvents: function() {
      var self = this;

      this.$input.on("blur", function(e) {
        var tags = self.$container.find(".tagger-tag");
        tags.removeClass("confirm");
        tags.last().after(self.$input);
      });

      // Event when user pastes content into the input
      this.$input.on("paste", function(e) {
        if (self.reachedNbMaxTags()) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          var elem = this;
          setTimeout(function(e) {
            self.adjustInputWidth($(elem).val());
          }, 0);
        }
      });

      this.$input.on("keyup", function(e) {
        switch (e.which) {
          case 8: // Backspace
          case 46: // Delete
            self.adjustInputWidth();
            break;
        }
      });
      // Events when user presses a key (that does not write anything in the box)
      this.$input.on("keydown", function(e) {
        if (e.which !== 8 && e.which !== 46) {
          // Remove Class confirm if it was previously set and user changed his mind
          self.$container.find(".tagger-tag").removeClass("confirm");
        }

        switch (e.which) {
          case 9: // Tab
          case 13: // Enter
            if ($.trim(self.$input.val()) !== "") {
              self.addTag();
              e.preventDefault();
              e.stopPropagation();
            } 
            break;
          case 8: // Backspace
          case 46: // Delete
            var inputText = self.$input.val();
            if (inputText.length === 0) {
              var elem;
              if (e.which === 8) { // 8: Backspace
                elem = self.$input.prev(".tagger-tag");
              } else { // 46: Delete
                elem = self.$input.next(".tagger-tag");
              }

              // Remove the confirm class to others if it was set earlier
              elem.siblings().removeClass("confirm");

              // Check if user needs to confirm
              if (self.options.confirmDelete) {
                if (elem.hasClass("confirm")) {
                  self.removeTag(elem.data("value"));
                } else {
                  elem.addClass("confirm");
                }
              } else {
                self.removeTag(elem.data("value"));
              }
            }
            self.adjustInputWidth();
            break;
          case 46: // Delete
            var inputText = self.$input.val();
            if (inputText.length === 0) {
              self.removeTag(self.$input.next(".tagger-tag").data("value"));
            } else {
              self.adjustInputWidth();
            }
            break;
          case 37: // Left arrow
            var inputText = self.$input.val();
            if (inputText.length === 0) {
              self.goToPreviousTag();
            }
            break;
          case 39: // Right arrow
            var inputText = self.$input.val();
            if (inputText.length === 0) {
              self.goToNextTag();
            }
            break;
          case 38: // Up arrow
            break;
          case 40: // Down arrow
            break;
          default:
            if (!e.ctrlKey && self.reachedNbMaxTags()) {
              e.preventDefault();
              e.stopPropagation();
            }
            break;
        }
      });

      // Events when user enters something inside the input field
      this.$input.on("keypress", function(e) {
        if (e.keyCode !== 8 && e.keyCode !== 46) {
          // Remove Class confirm if it was previously set and user changed his mind
          self.$container.find(".tagger-tag").removeClass("confirm");
        }
        self.adjustInputWidth(self.$input.val() + String.fromCharCode(e.keyCode));
      })

      // When user clicks on the container, it will focus the input field
      this.$container.on("click", function(e) {
        self.$input.focus();
      });

      this.$container.on("click", ".tagger-tag .remove-tag", function(e) {
        self.removeTag($(e.target).parents(".tagger-tag").data("value"));
      });
    },

    findTag: function(value) {
      return this.$container.find(".tagger-tag").filter(function() { return $.data(this, "value") == value; });
    },

    addTag: function(value) {
      value = $.trim(value || this.$input.val());
      if (value !== "") {
        var existingTag = this.findTag(value);
        if (existingTag.length > 0) {
          // Highlight already existing tag
          existingTag.css("opacity", 0).animate({opacity: 1}, 300);
        } else {
          var tag = $('<div class="tagger-tag">' + escapeHtml(value) + '<span class="remove-tag">&times;</span></div>');
          tag.data("value", value);
          this.$input.before(tag);
          this.inputReset(true);
        }
      }
    },

    goToPreviousTag: function() {
      this.$input.prev(".tagger-tag").before(this.$input);
      this.inputReset();
    },

    goToNextTag: function() {
      this.$input.next(".tagger-tag").after(this.$input);
      this.inputReset();
    },

    inputReset: function(noFocus) {
      this.$input.val("");
      this.$input.width(1);
      if (!noFocus) {
        var self = this;
        setTimeout(function() { self.$input.focus(); }, 10);
      }
    },

    adjustInputWidth: function(value) {
      value = value || this.$input.val(); // Take what is in the input field if value is not given
      $("taggerWidth").remove();
      var testSubject = $("<taggerWidth/>").css({
        position: "absolute",
        top: -9999,
        left: -9999,
        fontSize: this.$input.css("fontSize"),
        fontFamily: this.$input.css("fontFamily"),
        fontWeight: this.$input.css("fontWeight"),
        letterSpacing: this.$input.css("letterSpacing"),
        whiteSpace: "nowrap"
      });
      testSubject.html(escapeHtml(value));
      $("body").append(testSubject);

      var diff = this.$input.outerWidth() - this.$input.width(); // Keep a little margin
      this.$input.width(Math.min(this.$container.width() - diff, testSubject.width() + 1 /* The text cursor */));
    }
  };

  var escapeHtml = function(text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;")
               .replace(/ /g, "&nbsp;");
  };

  $.fn.tagger = function(arg1, arg2) {
    var self = this;
    var tagger = $(this).data("tagger");
    if (!tagger) {
      var options = $.extend({}, defaultOptions, arg1);
      return this.each(function() {
        var tagger = new Tagger($(this), options);
        $(this).data("tagger", tagger);
      });
    } else {
      if (tagger[arg1]) {
        return tagger[arg1](arg2);
      }
    }
  };
}(window.jQuery));