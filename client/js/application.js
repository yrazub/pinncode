$(function () {
    var messager = {
            send: function (message, callback) {
                $.get("/" + message, callback);
            }
        },
        mainWindow = {
            status: {
                cont: $('#configStatus'),
                init: function () {
                    $("#btnStart").click(function(){
                        messager.send("start", $.proxy(mainWindow.update, mainWindow));
                    });
                    $("#btnStop").click(function(){
                        messager.send("stop", $.proxy(mainWindow.update, mainWindow));
                    });
                    $("#btnCheck").click(function(){
                        messager.send("check", $.proxy(mainWindow.update, mainWindow));
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
                cont: $("#inputInterval"),
                label: $('#intervalLabel'),
                init: function () {
                    this.cont.change(function(){
                        messager.send("config/set/interval/" + this.value, $.proxy(mainWindow.update, mainWindow));
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
                    var template = new EJS({element: this.cont.get(0)}).render(data);
                    this.cont.siblings('ul').html(template);
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
        };

    mainWindow.init();

});