$(function () {
    var messager = {
        send: function (message, callback) {
            $.get("/" + message, callback);
        }
    };
    ({
        status: {
            init: function () {
                var self = this;
                $("#btnStart").click(function(){
                    messager.send("start", $.proxy(self.update, self));
                });
                $("#btnStop").click(function(){
                    messager.send("stop", $.proxy(self.update, self));
                });
                $("#btnCheck").click(function(){
                    messager.send("check", $.proxy(self.update, self));
                });
            },
            update: function () {
                reloadPage();
            }
        },
        emailInit: function () {

        },
        intervalInit: function () {
            $("#inputInterval").change(function(){
                messager.send("save?interval=" + this.value, reloadPage);
            });
        },
        init: function () {
            this.status.init();
            this.intervalInit();
        }
    }).init();


    function reloadPage(){
        document.location.reload();
    }

});



/*
function reloadPage(){
    document.location.reload();
}

$("#btnStart").click(function(){
    $.get("/start", reloadPage);
});

$("#btnStop").click(function(){
    $.get("/stop", reloadPage);
});

$("#btnCheck").click(function(){
    $.get("/check", reloadPage);
});

$("#inputInterval").change(function(){
    $.get("/save?interval=" + this.value, reloadPage);
});
*/