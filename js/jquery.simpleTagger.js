/* http://github.com/jpapillon/jquery.simpleTagger */
/* global jQuery, $ */
(function ($) {
  'use strict';

  // Plugin defaults
  var defaultOptions = {
    confirmDelete: false,
    maxNbTags: false,
    placeholderText: "Add..."
  };

  function SimpleTagger(elem, options) {
    this.options = options;

    this.$select = elem;
    this.$select.hide();

    // Wrap everything under a container
    this.$select.wrapAll($('<div class="tagger-container" />'));
    this.$container = elem.parents(".tagger-container");

    this.$inputContainer = $('<div class="input-container" />');
    this.$input = $('<input type="text" />');
    this.$placeholder = $('<span class="placeholder">' + (this.options.placeholderText ? this.options.placeholderText : "") + '</span>')
    this.$inputContainer.append(this.$input).append(this.$placeholder);
    this.$select.after(this.$inputContainer);

    // Add values set in the options
    var self = this;
    this.$select.find("option").each(function() {
      self.addTag($(this).val());
    });

    this.setEvents();
    this.adjustInputWidth();
  };

  SimpleTagger.prototype = {
    constructor: SimpleTagger,

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
        // Try to add a tag with current input and remove it afterwards
        self.addTag(self.$input.val());
        self.$input.val("");
        self.$placeholder.show();
        var tags = self.$container.find(".tagger-tag");
        tags.removeClass("confirm");
        tags.last().after(self.$inputContainer);
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
        if (self.$inputContainer.siblings(".tagger-tag.confirm").length > 0) {
          self.$placeholder.hide();
        }

        switch (e.which) {
          case 8: // Backspace
          case 46: // Delete
            self.adjustInputWidth();
            if (self.$input.val().length === 0) {
              self.$placeholder.show();
            } else {
              self.$placeholder.hide();
            }
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
              if (self.addTag()) {
                self.$placeholder.show();
              }
              e.preventDefault();
              e.stopPropagation();
            }
            self.adjustInputWidth();
            break;
          case 8: // Backspace
          case 46: // Delete
            var inputText = self.$input.val();
            if (inputText.length === 0) {
              var elem;
              if (e.which === 8) { // 8: Backspace
                elem = self.$inputContainer.prev(".tagger-tag");
              } else { // 46: Delete
                elem = self.$inputContainer.next(".tagger-tag");
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
            // Will adjust input width on "keyup"
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
        if (e.which !== 8 && e.which !== 46) {
          // Remove Class confirm if it was previously set and user changed his mind
          self.$container.find(".tagger-tag").removeClass("confirm");
        }

        if (e.which !== 13) { // Enter
          self.adjustInputWidth(self.$input.val() + String.fromCharCode(e.which));
          self.$placeholder.hide();
        } else {
          self.$placeholder.show();
          self.adjustInputWidth();
        }
      });

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
      var added = false;
      value = $.trim(value || this.$input.val());
      if (value !== "") {
        var existingTag = this.findTag(value);
        if (existingTag.length > 0) {
          // Highlight already existing tag
          existingTag.css("opacity", 0).animate({opacity: 1}, 300);
        } else {
          added = true;
          var tag = $('<div class="tagger-tag">' + escapeHtml(value) + '<span class="remove-tag">&times;</span></div>');
          tag.data("value", value);
          this.$inputContainer.before(tag);
          this.inputReset();
        }
      }

      return added;
    },

    goToPreviousTag: function() {
      this.$inputContainer.prevAll(".tagger-tag").first().before(this.$inputContainer);
      this.inputReset();
    },

    goToNextTag: function() {
      this.$inputContainer.nextAll(".tagger-tag").first().after(this.$inputContainer);
      this.inputReset();
    },

    inputReset: function(noFocus) {
      this.$input.val("");

      // To update focus on input (IE)
      var self = this;
      setTimeout(function() { self.$input.focus(); }, 10);

      this.adjustInputWidth();
    },

    adjustInputWidth: function(value) {
      value = value || this.$input.val(); // Take what is in the input field if value is not given

      // Create fake div to calculate actual text width
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

      var valueWidth = testSubject.width();

      // Use placeholder if it was set in the options
      var placeholderWidth = 0;
      if (this.options.placeholderText) {
        testSubject.html(escapeHtml(this.options.placeholderText));
        placeholderWidth = testSubject.width();
      }

      var width = Math.max(valueWidth, placeholderWidth);

      var diff = this.$input.outerWidth() - this.$input.width(); // Keep a little margin
      this.$input.width(Math.min(this.$container.width() - diff, width + 1 /* The text cursor */));
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

  $.fn.simpleTagger = function(arg1, arg2) {
    var self = this;
    var tagger = $(this).data("tagger");
    if (!tagger) {
      var options = $.extend({}, defaultOptions, arg1);
      return this.each(function() {
        var tagger = new SimpleTagger($(this), options);
        $(this).data("tagger", tagger);
      });
    } else {
      if (tagger[arg1]) {
        return tagger[arg1](arg2);
      }
    }
  };
}(window.jQuery));