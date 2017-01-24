/* global recursive */
"use strict";
kindFramework
    .config(function ($provide) {
        $provide.decorator("$q", function ($delegate) {
            function seqAll(fns) {
                //create a defer, which will return promise with setting resolve/reject
                var deferred = $delegate.defer();
                //create an array of results to store results of promises
                var results = [];
                var index = 0;

                try {
                    if(fns.length < 1)
                    {
                        throw new Error("$q.seqAll :: the length of argument is below zero");
                    }

                    if(!Array.isArray(fns)) {
                        throw new Error("$q.seqAll :: Type of argument is " + (typeof fns) + ". Array of functions is only allowed");
                    }

                    if (fns.every(isFunction)){
                        recursive(fns[index]);
                    } else {
                        throw new Error("$q.seqAll :: Type of argument is incorrect. Array of functions is only allowed");
                    }
                } catch(e) {
                    console.error(e.message);
                    deferred.reject('$q.seqAll :: promises[' + (index - 1) + ']' + ' rejected with status: ' + error.status);
                }

                function isFunction(value) {
                    if(typeof value === 'function')
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }

                //create a recursive function, which loops through all the promises one after the another
                function recursive(fn) {
                    var promise = fn();

                    index++;
                    if(promise === undefined)
                    {
                        if(index < fns.length) {
                            recursive(fns[index]);
                        } else {
                            deferred.resolve(results);
                        }
                    }
                    else
                    {
                        promise.then(function (data) {
                            // when success, push the data to results & again go for next promise else set defer resovle to array of data collected
                            results.push(data);
                            if (index < fns.length) {
                                recursive(fns[index]);
                            } else {
                                deferred.resolve(results);
                            }
                        }, function (error) {
                            // If promise got failed reject it & return from recursive loop of promises
                            deferred.reject('$q.seqAll :: promises[' + (index - 1) + ']' + ' rejected with status: ' + error.status);
                            return;
                        });                        
                    }

                }
                return deferred.promise;
            }

            function allSettled(promises) {
                // Implementation of allSettled function from Kris Kowal's Q
                // https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled
                function wrap(promise) {
                    return $delegate.when(promise)
                        .then(function (value) {
                            return { state: 'fulfilled', value: value };
                        })
                        .catch(function (reason) {
                            return { state: 'rejected', reason: reason };
                        });
                }

                var wrapped = angular.isArray(promises) ? [] : {};

                angular.forEach(promises, function(promise, key) {
                    if (!wrapped.hasOwnProperty(key)) {
                        wrapped[key] = wrap(promise);
                    }
                });

                return $delegate.all(wrapped);

            }

        $delegate.seqAll = seqAll;
        $delegate.allSettled = allSettled;

        return $delegate;
    });
});