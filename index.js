const fetch = require('node-fetch')
const rxjs = require('rxjs')
const io = require('socket.io-client')

let headers = {'Content-Type': 'application/json'}

module.exports = class qido {

    constructor(app, key = null) {
        this.baseUrl = 'https://qi.do'
        // this.baseUrl = 'http://localhost:3007'
        this.socketUrl = 'https://s.qi.do'
        this.app = app
        this.key = key
        this.token = null
        this.socket = null
    }

    getToken() {
        return this.token || localStorage.getItem('token') || sessionStorage.getItem('token')
    }

    request(endpoint = '', options = {}, token = null) {
        let url = this.baseUrl + endpoint
        if (!token) token = this.getToken()
        if (token) options.headers.authorization = 'Bearer ' + token
        if (this.key) options.headers.k = this.key
        return fetch(url, options).then(res => {
            if (res.ok) return res.json()
            throw res.status
        })
    }

    auth(login, pass = null) {
        if (login instanceof FormData) headers = {}
        else login = JSON.stringify({u: login, p: pass})
        const options = {
            method: 'POST',
            body: login,
            headers: headers
        }
        return this.request('/a/' + this.app, options)
    }

    create(path, object, token = null) {
        if (object instanceof FormData) headers = {}
        else object = JSON.stringify(object)
        const options = {
            method: 'POST',
            body: object,
            headers: headers
        }
        return this.request('/c/' + this.app + '/' + path, options, token)
    }

    read(path, token = null) {
        let url = '/r/' + this.app + '/' + path
        return this.request(url, {method: 'GET', headers: headers}, token)
    }

    update(path, props, token = null) {
        if (props instanceof FormData) headers = {}
        else props = JSON.stringify(props)
        const options = {
            method: 'PUT',
            body: props,
            headers: headers
        }
        return this.request('/u/' + this.app + '/' + path, options, token)
    }

    delete(path, token = null) {
        let url = '/d/' + this.app + '/' + path
        return this.request(url, {method: 'DELETE', headers: headers}, token)
    }

    stream(array, id) {
        const socketId = this.app + '-' + array + '-' + id
        return new rxjs.Observable(observer => {
            this.socket = io(this.socketUrl)
            this.socket.on(socketId, (data) => {
                observer.next(data)
            })
            return () => {
                this.socket.disconnect()
            }
        })
    }

    subscribe(subscription, token = null) {
        let url = '/p/' + this.app + '/s?x=' + JSON.stringify(subscription)
        let options = {
            method: 'POST',
            // body: JSON.stringify(subscription),
            headers: headers
        }
        return this.request(url, options, token)
    }

    broadcast(notification, audience = null, token = null) {
        let url = '/p/' + this.app + '/b?x=' + JSON.stringify(notification)
        let options = {
            method: 'POST',
            // body: JSON.stringify(notification),
            headers: headers
        }
        if (audience) url += '&q=' + JSON.stringify(audience)
        return this.request(url, options, token)
    }

    mail(message, config, token = null) {
        let url = '/m/' + this.app
        if (typeof config === String) url += '/' + config
        else message._c = config
        let options = {
            method: 'POST',
            body: JSON.stringify(message),
            headers: headers
        }
        return this.request(url, options, token)
    }
}
