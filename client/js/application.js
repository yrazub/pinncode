$(function () {
    var messager = {
            send: function (message, callback) {
                $.get('/' + message, callback);
            },
            sendForm: function (url, data, callback) {
                $.ajax({
                    url: url,
                    type: 'POST',
                    dataType: 'xml/html/script/json', // expected format for response
                    contentType: 'application/x-www-form-urlencoded',
                    data: data,
                    complete: function(data) {
                        callback(data);
                    }
                });
            }
        },
        mainWindow = {
            status: {
                cont: $('#configStatus'),
                init: function () {
                    $('#btnStart').click(function(){
                        messager.send('start', $.proxy(mainWindow.update, mainWindow));
                    });
                    $('#btnStop').click(function(){
                        messager.send('stop', $.proxy(mainWindow.update, mainWindow));
                    });
                    $('#btnCheck').click(function(){
                        messager.send('check', $.proxy(mainWindow.update, mainWindow));
                    });
                },
                update: function (isStarted) {
                    if (isStarted) {
                        this.cont.removeClass('label-danger');
                        this.cont.addClass('label-success');
                        this.cont.html('Started');
                    } else {
                        this.cont.removeClass('label-success');
                        this.cont.addClass('label-danger');
                        this.cont.html('Stopped');
                    }
                }
            },
            email: {
                cont: $('#InputEmail'),
                init: function () {
                    $('#InputEmail').parents('form').on('submit', $.proxy(function () {
                        messager.send('config/set/email/' + this.cont.val(), $.proxy(mainWindow.update, mainWindow));
                        return false;
                    }, this));
                }
            },
            interval: {
                cont: $('#inputInterval'),
                label: $('#intervalLabel'),
                init: function () {
                    this.cont.change(function(){
                        messager.send('config/set/interval/' + this.value, $.proxy(mainWindow.update, mainWindow));
                    });
                },
                update: function (val) {
                    this.cont.val(val);
                    this.label.html(val);
                }
            },
            tournament: {
                cont: $('#tournamentTemplate'),
                update: function (data) {
                    var template = new EJS({element: this.cont.children('template').get(0)}).render(data);
                    this.cont.children('ul').html(template);
                }
            },
            init: function () {
                this.status.init();
                this.email.init();
                this.interval.init();
                this.update();
            },
            update: function () {
                messager.send('models/pinncode', $.proxy(function (data) {
                    this.status.update(data.isStarted);
                    this.interval.update(data.interval);
                    this.email.cont.val(data.email);
                    this.tournament.update(data);
                }, this));
            }
        },
        betsWindow = {
            addBet: {
                cont: $('#betsForm'),
                msg: 'The value cannot be empty',
                errors: {},
                errorShowDuration: 10000,
                init: function () {
                    var self = this;
                    this.cont.on('submit', $.proxy(function () {
                        var data = {},
                            hasError = false;
                        $.each(this.cont.serializeArray(), function (i, field) {
                            data[field.name] = field.value;
                            if ($.trim(field.value) === '') {
                                hasError = true;
                                self.showError(field.name, self.msg);
                            } else {
                                self.hideError(self.cont.find('#formError_' + field.name));
                            }
                        });
                        if (!hasError) {
                            messager.sendForm(
                                'bets/add',
                                data,
                                $.proxy(betsWindow.update, betsWindow)
                            );
                        }
                        return false;
                    }, this));
                },
                reset: function () {
                    this.cont.get(0).reset();
                },
                showError: function (name, msg) {
                    var id = '#formError_' + name,
                        eCont = this.cont.find(id),
                        self = this;
                    this.hideError(eCont);
                    eCont.html(msg);
                    eCont.parents('.form-group').addClass('has-error');
                    (function (cont) {
                        self.errors[cont.attr('id')] = setTimeout(function () {
                            cont.fadeOut(500, function () {
                                self.hideError(cont);
                            });
                        }, self.errorShowDuration);
                    })(eCont);
                },
                hideError: function (cont) {
                    var self = this;
                    cont.each(function (index, element) {
                        var id = $(element).attr('id');
                        if (self.errors[id]) {
                            clearTimeout(self.errors[id]);
                            delete self.errors[id];
                        }
                    });
                    cont.html('');
                    cont.fadeIn(0);
                    cont.parents('.form-group').removeClass('has-error');
                }
            },
            betsList: {
                cont: $('#betsList'),
                init: function () {
                    var self = this;
                    this.cont.on('click', '.remove', function () {
                        self.remove($(this).parents('[data-id]').attr('data-id'));
                    });
                },
                remove: function (id) {
                    messager.send('bets/remove/' + id, $.proxy(betsWindow.update, betsWindow));
                },
                update: function (data) {
                    var template = new EJS({element: this.cont.find('template').get(0)}).render({bets: data});
                    this.cont.find('.list').html(template);
                }
            },
            init: function () {
                this.addBet.init();
                this.betsList.init();
                this.update();
            },
            update: function () {
                messager.send('bets/get', $.proxy(function (data) {
                    this.betsList.update(data);
                    this.addBet.reset();
                }, this));
            }
        };

    mainWindow.init();
    betsWindow.init();

});