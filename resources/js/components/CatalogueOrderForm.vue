<template>
    <div class="bg-white order-now p-5 shadow-lg" v-show="visible" :class="{ 'open z-10': visible }" :style="[visible ? {left: 0} : {}]">

        <img src="/storage/images/grimes-logo-black.png" alt="Grimes Engravers Ltd" class="pb-5 pt-5 text-center"/>
        <div class="bg-teal-100 border-t-4 border-teal-500 mb-5 px-4 py-3 rounded-b shadow-md text-teal-900" role="alert" v-if="showSuccess">
            <div class="flex items-center">
                <div class="py-1"><svg class="fill-current h-6 w-6 text-teal-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"></path></svg></div>
                <div>
                    <p class="text-sm">Order form submitted successfully</p>
                </div>
            </div>
        </div>
        <div class="w-full" v-if="!showSuccess">
            <h2 class="mb-5 text-2xl">Online Catalogue Order Form:</h2>
            <div class="bg-red-100 border-red-500 border-t-4 mb-5 px-4 py-3 rounded-b shadow-md text-red-900" role="alert" v-if="errors.length">
                <div class="flex items-center">
                    <div class="py-1"><svg class="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"></path></svg></div>
                    <div>
                        <ul>
                            <li class="text-sm" v-for="error in errors">{{ error }}</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div v-if="!nextStep">

                <div v-for="(line, index) in lines" :key="index" class="mb-5">
                    <div class="flex flex-wrap mb-5">
                        <div class="mb-6 md:mb-0 px-1 sm:w-1/6 w-1/4" >
                            <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                                Qty
                            </label>
                            <input
                                class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                type="number" placeholder="1" min="0" v-model="line.qty">
                        </div>
                        <div class="mb-6 md:mb-0 px-1 sm:w-7/12 w-3/4">
                            <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                                Description
                            </label>
                            <input
                                class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                name="description" type="text" placeholder="Catalogue Number i.e. TF001A.12" v-model="line.description">
                        </div>
                        <div class="mb-6 md:mb-0 px-1 sm:w-1/4 w-full" v-model="line.engravingOption">
                            <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                                Engraving
                            </label>
                            <div class="relative">
                                <select
                                    class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                    @change="toggleEngraving($event, index)">
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                </select>
                                <div
                                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                                         viewBox="0 0 20 20">
                                        <path
                                            d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="w-full"  v-if="line.engravingOption">
                        <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                            Engraving <span class="text-red-500 text-xs italic"></span>
                        </label>
                        <textarea
                            class=" appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            name="message" rows="4" cols="50" spellcheck="false" v-model="line.engraving"></textarea>
                    </div>
                    <p v-if="index > 0" @click="removeLine(index)" class="cursor-pointer pb-3 text-red-600 text-right"><span>Remove Item <i class="fa fa-trash-alt"></i></span></p>

                </div>

                <div class="mb-5 flex">
                    <a @click="addLine"
                       class="bg-green-600 border border-gray-400 cursor-pointer font-semibold hover:bg-green-500 px-4 py-2 rounded shadow text-white">Add
                        Item <i class="fa fa-plus ml-1"></i></a>
                    <a
                        @click="nextStep = true" class="cursor-pointer bg-white border border-gray-400 font-semibold hover:bg-gray-100 mr-0 mx-auto px-4 py-2 rounded shadow text-gray-800">
                        Next Step  <i class="fas fa-caret-right ml-1"></i>
                    </a>
                </div>
            </div>
        </div>

        <div v-if="nextStep" v-if="!showSuccess>
            <div class="flex flex-wrap -mx-3 mb-6">
                <div class="w-full px-3 mb-6 md:mb-0">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                        Name <span class="text-red-500 text-xs italic">*</span>
                    </label>
                    <input class=" appearance-none block w-full bg-gray-200 text-gray-700 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" name="name" type="text" placeholder="Jane" v-model="name">
                </div>
                <div class="w-full px-3">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-last-name">
                        Email <span class="text-red-500 text-xs italic">*</span>
                    </label>
                    <input class=" appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" name="email" type="email" placeholder="jane@gmail.com" v-model="email">
                </div>
            </div>

            <div class="w-full" >
                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                    Additional Order Comments
                </label>
                <textarea
                    class=" appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    name="message" rows="4" cols="50" spellcheck="false" v-model="additionalComments"></textarea>
            </div>
            <div class="flex">
            <a
                @click="nextStep = false" class="cursor-pointer bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                <i class="fas fa-caret-left mr-1"></i> Back
            </a>
            <a
                @click="submit()" class="cursor-pointer bg-white hover:bg-gray-100 text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow mx-auto mr-0 bg-green-600 hover:bg-green-500">
                Submit
            </a>
            </div>
        </div>

        </div>
    </div>
</template>

<script>
    import axios from 'axios';

    export default {
        props: {
            visible: Boolean,
        },
        data: function () {
            return {
                errors:[],
                lines: [],
                blockRemoval: true,
                index: null,
                additionalComments: null,
                name: null,
                email: null,
                showSuccess: false,
                nextStep: false,
            };
        },
        watch: {
            lines() {
                this.blockRemoval = this.lines.length <= 1
            }
        },
        methods: {
            toggleEngraving(event, lineId) {
                this.lines[lineId].engravingOption = false;
                if (event.target.value === 'yes') {
                    this.lines[lineId].engravingOption = true;
                }
            },
            addLine() {
                let checkEmptyLines = this.lines.filter(line => line.number === null);
                if (checkEmptyLines.length >= 1 && this.lines.length > 0) return;
                this.lines.push({
                    qty: null,
                    description: null,
                    engravingOption: false,
                    engraving: null,
                })
            },
            removeLine(lineId) {
                if (!this.blockRemoval) this.lines.splice(lineId, 1)
            },
            submit() {
                const data = {
                    "items" : this.lines,
                    "name" : this.name,
                    "email" : this.email,
                    "additional_comments" : this.additionalComments,
                };

                if (this.checkForm()) {
                    axios.post(`catalogue-enquiry`, data).then(
                        response => {
                            this.showSuccess = true;
                        });
                }
            },
            checkForm: function (e) {
                if (this.name && this.email) {
                    return true;
                }

                this.errors = [];

                if (!this.name) {
                    this.errors.push('Name required.');
                }
                if (!this.email) {
                    this.errors.push('Email required.');
                }

                e.preventDefault();
            }
        },
        mounted() {
            this.addLine();
        },
    }
</script>

<style>

        .order-now {
        -webkit-overflow-scrolling: touch;
        -webkit-transition: left .3s;
        -moz-transition: left .3s;
        -ms-transition: left .3s;
        transition: left .3s;
        height: 100%;
        left: -50%;
        overflow: auto;
        position: fixed;
        top: 0;
        width: 50%;
    }

        @media only screen and (max-width: 600px) {
            .order-now {
                left: -90%;
                width: 90%;
            }
        }

    .order-now .open {
        left: 0;
    }
</style>
